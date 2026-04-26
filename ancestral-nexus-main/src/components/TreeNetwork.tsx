import React, { useState, useRef, useCallback, useEffect, useMemo, useImperativeHandle, forwardRef } from "react";
import { Person } from "@/types/database";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

export interface TreeNetworkHandle {
  resetView: () => void;
}

interface TreeNetworkProps {
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
  timeFilter: number;
  people: Person[];
  generationFilter?: number | null;
}

const NODE_RADIUS = 28;
const GEN_SPACING_Y = 160;
const BASE_OFFSET_Y = 80;

const getInitials = (p: Person) => `${p.firstName[0] || ""}${p.lastName[0] || ""}`;

const TreeNetwork = forwardRef<TreeNetworkHandle, TreeNetworkProps>(({ onSelectPerson, selectedPersonId, timeFilter, people, generationFilter }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [customPositions, setCustomPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const didDragRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const visiblePeople = useMemo(() => {
    let filtered = people.filter(p => p.birthYear <= timeFilter);
    if (generationFilter !== null && generationFilter !== undefined) {
      filtered = filtered.filter(p => p.generation >= generationFilter);
    }
    return filtered;
  }, [timeFilter, people, generationFilter]);

  const visibleIds = useMemo(() => new Set(visiblePeople.map(p => p.id)), [visiblePeople]);

  const nodePositions = useMemo(() => {
    const NODE_SPACING = 140;
    const visiblePeopleSet = visibleIds;
    const visibleList = people.filter(p => visiblePeopleSet.has(p.id));
    if (visibleList.length === 0) return [];

    const generations = [...new Set(visibleList.map(p => p.generation))].sort((a, b) => a - b);
    const minGen = generations[0];

    // Build parent->children map (visible only)
    const childrenOf = new Map<string, string[]>();
    const parentOf = new Map<string, string[]>();
    visibleList.forEach(p => {
      const visibleParents = p.parentIds.filter(id => visiblePeopleSet.has(id));
      parentOf.set(p.id, visibleParents);
      visibleParents.forEach(pid => {
        const kids = childrenOf.get(pid) || [];
        kids.push(p.id);
        childrenOf.set(pid, [...new Set(kids)]);
      });
    });

    // Identify ex-spouses (visible only)
    const exSpouseSet = new Set<string>();
    visibleList.forEach(p => {
      p.exSpouseIds.filter(sid => visiblePeopleSet.has(sid)).forEach(sid => exSpouseSet.add(sid));
    });

    // Group current spouses together (exclude ex-spouses from groups)
    // Order: person with parents in tree first (left), spouse without parents second (right)
    const spouseGroups = new Map<string, string[]>();
    const assignedToGroup = new Set<string>();
    visibleList.forEach(p => {
      if (assignedToGroup.has(p.id)) return;
      const group = [p.id];
      assignedToGroup.add(p.id);
      p.spouseIds.filter(sid => visiblePeopleSet.has(sid)).forEach(sid => {
        if (!assignedToGroup.has(sid)) {
          group.push(sid);
          assignedToGroup.add(sid);
        }
      });
      // Sort group: people with parents in tree come first (left side)
      group.sort((a, b) => {
        const aHasParents = (parentOf.get(a) || []).length > 0 || visibleList.find(pp => pp.id === a)!.parentIds.some(id => visiblePeopleSet.has(id));
        const bHasParents = (parentOf.get(b) || []).length > 0 || visibleList.find(pp => pp.id === b)!.parentIds.some(id => visiblePeopleSet.has(id));
        if (aHasParents && !bHasParents) return -1;
        if (!aHasParents && bHasParents) return 1;
        return 0;
      });
      group.forEach(id => spouseGroups.set(id, group));
    });

    // Get unique family units per generation (group of spouses counts as one unit)
    const genUnits = new Map<number, string[][]>(); // gen -> array of groups
    const processedGroups = new Set<string>();
    generations.forEach(gen => {
      const units: string[][] = [];
      visibleList.filter(p => p.generation === gen).forEach(p => {
        const group = spouseGroups.get(p.id) || [p.id];
        const groupKey = [...group].sort().join(",");
        if (!processedGroups.has(groupKey)) {
          processedGroups.add(groupKey);
          units.push(group);
        }
      });
      genUnits.set(gen, units);
    });

    // Position using a two-pass approach:
    // Pass 1: Assign initial x positions per generation (spread evenly)
    const posMap = new Map<string, { x: number; y: number }>();

    // First, position the widest generation evenly
    let maxUnits = 0;
    let widestGen = minGen;
    generations.forEach(gen => {
      const units = genUnits.get(gen) || [];
      const totalNodes = units.reduce((sum, g) => sum + g.length, 0);
      if (totalNodes > maxUnits) { maxUnits = totalNodes; widestGen = gen; }
    });

    // Position each generation
    generations.forEach(gen => {
      const units = genUnits.get(gen) || [];
      const y = BASE_OFFSET_Y + (gen - minGen) * GEN_SPACING_Y;

      // Flatten units to get all people in order
      const allInGen: string[] = [];
      units.forEach(group => group.forEach(id => allInGen.push(id)));

      const totalWidth = Math.max(1, allInGen.length - 1) * NODE_SPACING;
      const startX = NODE_RADIUS + 50;

      allInGen.forEach((id, i) => {
        posMap.set(id, { x: startX + i * NODE_SPACING + (maxUnits - allInGen.length) * NODE_SPACING / 2, y });
      });
    });

    // Pass 2: Adjust children to center under their parents
    // Process from top generation down
    generations.forEach(gen => {
      const units = genUnits.get(gen) || [];
      units.forEach(group => {
        // Find all children of this family unit
        const allChildren: string[] = [];
        group.forEach(pid => {
          const kids = childrenOf.get(pid) || [];
          kids.forEach(kid => {
            if (!allChildren.includes(kid)) allChildren.push(kid);
          });
        });

        if (allChildren.length === 0) return;

        // Calculate parent group center
        const parentXs = group.map(id => posMap.get(id)?.x || 0);
        const parentCenter = (Math.min(...parentXs) + Math.max(...parentXs)) / 2;

        // Calculate children's current center
        const childXs = allChildren.map(id => posMap.get(id)?.x || 0);
        const childCenter = (Math.min(...childXs) + Math.max(...childXs)) / 2;

        // Shift children to center under parents
        const shift = parentCenter - childCenter;
        allChildren.forEach(id => {
          const pos = posMap.get(id);
          if (pos) posMap.set(id, { ...pos, x: pos.x + shift });
        });
      });
    });

    // Position ex-spouses: the person with fewer family ties (no parents in tree) goes left
    const EX_SPOUSE_OFFSET = 0;
    const processedExPairs = new Set<string>();
    visibleList.forEach(p => {
      p.exSpouseIds.filter(sid => visiblePeopleSet.has(sid)).forEach(sid => {
        const pairKey = [p.id, sid].sort().join("-");
        if (processedExPairs.has(pairKey)) return;
        processedExPairs.add(pairKey);

        const exPerson = visibleList.find(pp => pp.id === sid);
        if (!exPerson) return;

        // Determine who is the "main" family member:
        // The one with parents in the tree, or more family connections (children, current spouse)
        const pHasParents = p.parentIds.some(id => visiblePeopleSet.has(id));
        const exHasParents = exPerson.parentIds.some(id => visiblePeopleSet.has(id));
        const pFamilyScore = p.parentIds.filter(id => visiblePeopleSet.has(id)).length + p.spouseIds.filter(id => visiblePeopleSet.has(id)).length + p.childIds.filter(id => visiblePeopleSet.has(id)).length;
        const exFamilyScore = exPerson.parentIds.filter(id => visiblePeopleSet.has(id)).length + exPerson.spouseIds.filter(id => visiblePeopleSet.has(id)).length + exPerson.childIds.filter(id => visiblePeopleSet.has(id)).length;

        let mainId: string, outsiderId: string;
        if (pHasParents && !exHasParents) {
          mainId = p.id; outsiderId = sid;
        } else if (!pHasParents && exHasParents) {
          mainId = sid; outsiderId = p.id;
        } else {
          // Both or neither have parents — use family score
          mainId = pFamilyScore >= exFamilyScore ? p.id : sid;
          outsiderId = mainId === p.id ? sid : p.id;
        }

        const mainPos = posMap.get(mainId);
        if (mainPos) {
          posMap.set(outsiderId, { x: mainPos.x - NODE_SPACING - EX_SPOUSE_OFFSET, y: mainPos.y });
        }
      });
    });

    // Resolve overlaps within each generation
    generations.forEach(gen => {
      const genPeople = visibleList.filter(p => p.generation === gen);
      genPeople.sort((a, b) => (posMap.get(a.id)?.x || 0) - (posMap.get(b.id)?.x || 0));

      for (let i = 1; i < genPeople.length; i++) {
        const prev = posMap.get(genPeople[i - 1].id)!;
        const curr = posMap.get(genPeople[i].id)!;
        const minDist = NODE_SPACING;
        if (curr.x - prev.x < minDist) {
          posMap.set(genPeople[i].id, { ...curr, x: prev.x + minDist });
        }
      }
    });

    // Ensure all x positions are positive
    let minX = Infinity;
    posMap.forEach(pos => { if (pos.x < minX) minX = pos.x; });
    const offsetX = minX < NODE_RADIUS + 20 ? NODE_RADIUS + 20 - minX : 0;

    return visibleList.map(p => {
      const pos = posMap.get(p.id)!;
      return { x: pos.x + offsetX, y: pos.y, person: p };
    });
  }, [visibleIds, people]);

  // Merge auto-layout with custom (dragged) positions
  const finalNodePositions = useMemo(() => {
    return nodePositions.map(np => {
      const custom = customPositions.get(np.person.id);
      if (custom) return { ...np, x: custom.x, y: custom.y };
      return np;
    });
  }, [nodePositions, customPositions]);

  const posMap = useMemo(() => {
    const m = new Map<string, { x: number; y: number; person: Person }>();
    finalNodePositions.forEach(np => m.set(np.person.id, np));
    return m;
  }, [finalNodePositions]);

  const connections = useMemo(() => {
    const conns: { from: { x: number; y: number; person: Person }; to: { x: number; y: number; person: Person }; type: "parent" | "spouse" | "ex-spouse" }[] = [];
    const seen = new Set<string>();

    visiblePeople.forEach(person => {
      const pos = posMap.get(person.id);
      if (!pos) return;

      person.parentIds.forEach(pid => {
        const parentPos = posMap.get(pid);
        if (parentPos) {
          const key = [pid, person.id].sort().join("-") + "-p";
          if (!seen.has(key)) { seen.add(key); conns.push({ from: parentPos, to: pos, type: "parent" }); }
        }
      });

      person.spouseIds.forEach(sid => {
        const spousePos = posMap.get(sid);
        if (spousePos) {
          const key = [person.id, sid].sort().join("-") + "-s";
          if (!seen.has(key)) { seen.add(key); conns.push({ from: pos, to: spousePos, type: "spouse" }); }
        }
      });

      person.exSpouseIds.forEach(sid => {
        const exPos = posMap.get(sid);
        if (exPos) {
          const key = [person.id, sid].sort().join("-") + "-ex";
          if (!seen.has(key)) { seen.add(key); conns.push({ from: pos, to: exPos, type: "ex-spouse" }); }
        }
      });
    });

    return conns;
  }, [visiblePeople, posMap]);

  const getConnectedIds = useCallback((personId: string): Set<string> => {
    const ids = new Set<string>([personId]);
    const person = people.find(p => p.id === personId);
    if (person) {
      person.parentIds.forEach(id => ids.add(id));
      person.childIds.forEach(id => ids.add(id));
      person.spouseIds.forEach(id => ids.add(id));
    }
    return ids;
  }, [people]);

  const connectedIds = useMemo(() =>
    hoveredId ? getConnectedIds(hoveredId) : new Set<string>(),
    [hoveredId, getConnectedIds]
  );

  const centerToTop = useCallback((scale?: number) => {
    if (containerRef.current) {
      setTransform(t => ({ x: 0, y: 10, scale: scale ?? t.scale }));
    }
  }, []);

  useImperativeHandle(ref, () => ({ resetView: () => centerToTop(0.85) }), [centerToTop]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(t => {
      const newScale = Math.max(0.3, Math.min(3, t.scale * delta));
      return { x: 0, y: 10, scale: newScale };
    });
  }, []);

  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left - transform.x) / transform.scale,
      y: (clientY - rect.top - transform.y) / transform.scale,
    };
  }, [transform]);

  const handleNodeDragStart = useCallback((e: React.MouseEvent, personId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const svgPos = screenToSvg(e.clientX, e.clientY);
    const nodePos = posMap.get(personId);
    if (!nodePos) return;
    setDraggedId(personId);
    didDragRef.current = false;
    setDragOffset({ x: svgPos.x - nodePos.x, y: svgPos.y - nodePos.y });
  }, [screenToSvg, posMap]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !draggedId) { setIsPanning(true); setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y }); }
  }, [transform.x, transform.y, draggedId]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedId) {
      didDragRef.current = true;
      const svgPos = screenToSvg(e.clientX, e.clientY);
      setCustomPositions(prev => {
        const next = new Map(prev);
        next.set(draggedId, { x: svgPos.x - dragOffset.x, y: svgPos.y - dragOffset.y });
        return next;
      });
    } else if (isPanning) {
      setTransform(t => ({ ...t, x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
    }
  }, [draggedId, dragOffset, isPanning, panStart, screenToSvg]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggedId(null);
  }, []);

  useEffect(() => { centerToTop(0.85); }, []);
  useEffect(() => { centerToTop(); }, [generationFilter, centerToTop]);

  const neon = isDark ? "#39ff14" : "#9333ea";
  const neonRgba = (a: number) => isDark ? `rgba(57, 255, 20, ${a})` : `rgba(147, 51, 234, ${a})`;

  // Neon royal blue for light mode nodes
  const nodeBlueNeon = "#1E40FF";

  const colors = {
    primary: neon,
    blue: isDark ? "#38bdf8" : "#00AEEF",
    nodeStroke: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.15)",
    connInactive: neonRgba(isDark ? 0.55 : 0.5),
    spouseInactive: isDark ? "rgba(56, 189, 248, 0.5)" : "rgba(0, 174, 239, 0.45)",
    textDefault: isDark ? "#f0eef5" : "#ffffff",
    textFaded: isDark ? "#d4d0dc" : "#444",
    textYear: isDark ? "#d4d0dc" : "#444",
    labelHover: isDark ? "#ffffff" : "#000000",
    nameDefault: isDark ? "#f0eef5" : "#1a1a1a",
  };

  const isConnectionHighlighted = (from: { person: Person }, to: { person: Person }) => {
    if (!hoveredId) return false;
    return connectedIds.has(from.person.id) && connectedIds.has(to.person.id);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg ref={svgRef} className="w-full h-full" style={{ minHeight: "100%" }}>
        <defs>
          <filter id="glow-neon">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-royal">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="node-gradient-male" cx="30%" cy="30%">
            <stop offset="0%" stopColor={isDark ? "#1a1a1a" : "#2554FF"} />
            <stop offset="100%" stopColor={isDark ? "#0a0a0a" : "#1E3AE8"} />
          </radialGradient>
          <radialGradient id="node-selected-male" cx="30%" cy="30%">
            <stop offset="0%" stopColor={isDark ? "#222222" : "#4060FF"} />
            <stop offset="100%" stopColor={isDark ? "#111111" : "#2040DD"} />
          </radialGradient>
          <radialGradient id="node-gradient-female" cx="30%" cy="30%">
            <stop offset="0%" stopColor={isDark ? "#1a1a1a" : "#e84393"} />
            <stop offset="100%" stopColor={isDark ? "#0a0a0a" : "#c2185b"} />
          </radialGradient>
          <radialGradient id="node-selected-female" cx="30%" cy="30%">
            <stop offset="0%" stopColor={isDark ? "#222222" : "#f06292"} />
            <stop offset="100%" stopColor={isDark ? "#111111" : "#d81b60"} />
          </radialGradient>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-pink">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {connections.map((conn, i) => {
            const highlighted = isConnectionHighlighted(conn.from, conn.to);
            if (conn.type === "spouse") {
              return (
                <line key={`conn-${i}`} x1={conn.from.x} y1={conn.from.y} x2={conn.to.x} y2={conn.to.y}
                  stroke={highlighted ? colors.blue : colors.spouseInactive}
                  strokeWidth={highlighted ? 2 : 1} strokeDasharray={highlighted ? "none" : "6 4"}
                  filter={highlighted ? "url(#glow-blue)" : "none"} style={{ transition: "all 0.3s ease" }} />
              );
            }
            if (conn.type === "ex-spouse") {
              return (
                <line key={`conn-${i}`} x1={conn.from.x} y1={conn.from.y} x2={conn.to.x} y2={conn.to.y}
                  stroke={highlighted ? "#f87171" : (isDark ? "rgba(248,113,113,0.4)" : "rgba(220,38,38,0.35)")}
                  strokeWidth={highlighted ? 2 : 1} strokeDasharray="4 6"
                  opacity={0.7} style={{ transition: "all 0.3s ease" }} />
              );
            }
            const midY = (conn.from.y + conn.to.y) / 2;
            return (
              <path key={`conn-${i}`}
                d={`M ${conn.from.x} ${conn.from.y + NODE_RADIUS} C ${conn.from.x} ${midY}, ${conn.to.x} ${midY}, ${conn.to.x} ${conn.to.y - NODE_RADIUS}`}
                fill="none" stroke={highlighted ? colors.primary : colors.connInactive}
                strokeWidth={highlighted ? 2.5 : 1.5}
                filter={highlighted ? "url(#glow-neon)" : "none"} style={{ transition: "all 0.3s ease" }} />
            );
          })}

          {finalNodePositions.map(({ x, y, person }) => {
            const isSelected = person.id === selectedPersonId;
            const isHovered = person.id === hoveredId;
            const isConnected = connectedIds.has(person.id);
            const isDead = person.deathYear && person.deathYear <= timeFilter;
            const isDragging = person.id === draggedId;
            const opacity = isDead ? 0.5 : 1;
            const isFemale = person.gender === "female";
            const genderSuffix = isFemale ? "female" : "male";
            const pinkNeon = "#ff69b4";
            const femaleStroke = isDark ? pinkNeon : "#c2185b";
            const nodeStrokeColor = isFemale
              ? (isSelected ? femaleStroke : isHovered ? pinkNeon : isConnected ? (isDark ? "rgba(255,105,180,0.5)" : "rgba(194,24,91,0.5)") : (isDark ? "rgba(255,105,180,0.3)" : "rgba(194,24,91,0.3)"))
              : (isSelected ? (isDark ? colors.primary : nodeBlueNeon) : isHovered ? colors.blue : isConnected ? neonRgba(0.5) : colors.nodeStroke);
            const pulseStroke = isFemale
              ? (isSelected ? femaleStroke : pinkNeon)
              : (isSelected ? (isDark ? colors.primary : nodeBlueNeon) : colors.blue);
            const glowFilter = isFemale
              ? (isSelected ? (isDark ? "url(#glow-pink)" : "url(#glow-pink)") : isHovered ? "url(#glow-pink)" : "none")
              : (isSelected ? (isDark ? "url(#glow-green)" : "url(#glow-royal)") : isHovered ? "url(#glow-blue)" : "none");
            const textColor = isDark
              ? (isFemale ? (isSelected ? pinkNeon : isHovered ? pinkNeon : pinkNeon) : (isSelected ? colors.primary : isHovered ? colors.blue : "#39ff14"))
              : "#ffffff";

            return (
              <g key={person.id} transform={`translate(${x}, ${y})`}
                style={{ cursor: isDragging ? "grabbing" : "pointer", transition: isDragging ? "none" : "opacity 0.5s ease" }} opacity={opacity}
                onMouseEnter={() => !draggedId && setHoveredId(person.id)} onMouseLeave={() => setHoveredId(null)}
                onMouseDown={(e) => handleNodeDragStart(e, person.id)}
                onClick={(e) => { e.stopPropagation(); if (!didDragRef.current) onSelectPerson(person); }}>
                {(isSelected || isHovered) && (
                  <circle r={NODE_RADIUS + 12} fill="none"
                    stroke={pulseStroke}
                    strokeWidth="1" opacity="0.3">
                    <animate attributeName="r" from={String(NODE_RADIUS + 8)} to={String(NODE_RADIUS + 25)} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r={NODE_RADIUS + 3} fill="none"
                  stroke={nodeStrokeColor}
                  strokeWidth={isSelected || isHovered ? 2 : 1} style={{ transition: "all 0.3s ease" }} />
                <circle r={NODE_RADIUS} fill={isSelected ? `url(#node-selected-${genderSuffix})` : `url(#node-gradient-${genderSuffix})`}
                  stroke={nodeStrokeColor}
                  strokeWidth={isSelected || isHovered ? 2 : 1}
                  filter={glowFilter}
                  style={{ transition: "all 0.3s ease" }} />
                {person.photoUrl ? (
                  <>
                    <clipPath id={`clip-${person.id}`}>
                      <circle r={NODE_RADIUS} />
                    </clipPath>
                    <image
                      href={person.photoUrl}
                      x={-NODE_RADIUS}
                      y={-NODE_RADIUS}
                      width={NODE_RADIUS * 2}
                      height={NODE_RADIUS * 2}
                      clipPath={`url(#clip-${person.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                ) : (
                  <text textAnchor="middle" dy="0.35em"
                    fill={textColor}
                    fontSize="12" fontFamily="Orbitron, sans-serif" fontWeight="600" style={{ transition: "fill 0.3s ease" }}>
                    {getInitials(person)}
                  </text>
                )}
                {(() => {
                  const fullName = `${person.firstName} ${person.lastName}`;
                  const words = fullName.split(" ");
                  let lines: string[];
                  if (words.length <= 2) {
                    lines = [fullName];
                  } else if (words.length <= 4) {
                    // Split into 2 lines: first name + rest
                    lines = [person.firstName, person.lastName];
                  } else {
                    // 5+ words: split into 3 lines
                    const third = Math.ceil(words.length / 3);
                    lines = [
                      words.slice(0, third).join(" "),
                      words.slice(third, third * 2).join(" "),
                      words.slice(third * 2).join(" "),
                    ];
                  }
                  const nameYOffset = NODE_RADIUS + 16;
                  const lineHeight = 13;
                  const yearYOffset = nameYOffset + lines.length * lineHeight;
                  return (
                    <>
                      {lines.map((line, idx) => (
                        <text key={idx} textAnchor="middle" y={nameYOffset + idx * lineHeight}
                          fill={isSelected || isHovered || isConnected ? colors.labelHover : colors.nameDefault}
                          fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" style={{ transition: "fill 0.3s ease" }}>
                          {line}
                        </text>
                      ))}
                      <text textAnchor="middle" y={yearYOffset}
                        fill={isSelected || isHovered ? (isDark ? "#f0eef5" : "#1a1a1a") : colors.textYear}
                        fontSize="9" fontFamily="JetBrains Mono, monospace" style={{ transition: "fill 0.3s ease" }}>
                        {person.birthYear}{person.deathYear ? ` — ${person.deathYear}` : " — presente"}
                      </text>
                    </>
                  );
                })()}
                <circle cx={NODE_RADIUS - 4} cy={-NODE_RADIUS + 4} r="3"
                  fill={person.gender === "male" ? "#00AEEF" : "#ff6b9d"} opacity="0.8" />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
});

export default TreeNetwork;
