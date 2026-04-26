import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CRITERIA_BY_TYPE, type EntityType, type ScoringCriterion } from "@/lib/scoring";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  return (
    <AppLayout title="Settings">
      <div className="max-w-3xl space-y-6">
        <p className="text-muted-foreground">
          Evaluation criteria are fixed per entity type. Below is the full reference of criteria and their weights.
        </p>

        {(Object.entries(CRITERIA_BY_TYPE) as [EntityType, ScoringCriterion[]][]).map(([type, criteria]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="capitalize">{type} Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {criteria.map((c, i) => (
                  <div key={c.key}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {c.label}
                        {c.inverted && (
                          <span className="text-muted-foreground ml-1 text-xs">(inverted — lower = better)</span>
                        )}
                      </span>
                      <span className="font-bold text-sm">{c.weight}%</span>
                    </div>
                    {i < criteria.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{criteria.reduce((s, c) => s + c.weight, 0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
};

export default Settings;
