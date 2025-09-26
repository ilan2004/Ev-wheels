"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/layout/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { vehiclesApi, type VehicleCase } from "@/lib/api/vehicles";
import { serviceTicketsApi } from "@/lib/api/service-tickets";
import { supabase } from "@/lib/supabase/client";

export default function VehiclesListPage() {
  const [vehicles, setVehicles] = useState<VehicleCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});

  const load = async (term?: string) => {
    setLoading(true);
    const res = await vehiclesApi.listVehicles({ search: term });
    if (res.success && res.data) setVehicles(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const loadThumbs = async () => {
      const map: Record<string, string | null> = {};
      for (const v of vehicles) {
        try {
          const res = await serviceTicketsApi.listVehicleAttachments(v.service_ticket_id, v.id);
          if (res.success && res.data) {
            const firstPhoto = res.data.find(a => a.attachment_type === 'photo');
            if (firstPhoto) {
              const { data } = await supabase.storage.from('media-photos').createSignedUrl(firstPhoto.storage_path, 60 * 60);
              map[v.id] = data?.signedUrl || null;
            } else {
              map[v.id] = null;
            }
          }
        } catch {
          map[v.id] = null;
        }
      }
      setThumbs(map);
    };
    if (vehicles.length) loadThumbs();
  }, [vehicles]);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Vehicle Cases" description="List of vehicle service cases" />

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Input
            placeholder="Search by reg no, make, or model"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load(search);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : vehicles.length === 0 ? (
            <div className="text-sm text-muted-foreground">No vehicle cases found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v) => (
                <Link key={v.id} href={`/dashboard/vehicles/${v.id}`} className="border rounded p-4 hover:bg-muted">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{v.vehicle_make} {v.vehicle_model}</div>
                    <Badge variant="secondary">{v.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{v.vehicle_reg_no || "-"}</div>
                  {thumbs[v.id] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbs[v.id]!} alt="thumbnail" className="mt-2 w-full h-24 object-cover rounded" />
                  )}
                  <div className="text-xs text-muted-foreground mt-1">{new Date(v.created_at).toLocaleString()}</div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

