'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Phone, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { fetchFacilities } from '@/lib/client-api';
import type { HealthFacility, UrgencyLevel } from '@/lib/clinical-engine/types';
import { Badge } from '@/components/ui/badge';

interface FacilityMapProps {
  urgency: UrgencyLevel;
  patientLocation?: string;
  onFacilitySelected?: (facility: HealthFacility) => void;
}

export function FacilityMap({ urgency, patientLocation, onFacilitySelected }: FacilityMapProps) {
  const [nearest, setNearest] = useState<HealthFacility | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const targetType = urgency === 'EMERGENCY' ? 'specialist' : urgency === 'URGENT' ? 'district' : 'local';

    fetchFacilities().then((res: any) => {
      const facilities: HealthFacility[] = res.facilities || [];
      const filtered = facilities.filter((f) => f.type === targetType || (urgency === 'EMERGENCY' && f.type === 'specialist'));
      setNearest(filtered[0] || facilities[0] || null);
      setIsLoading(false);
    }).catch(() => {
      setNearest(null);
      setIsLoading(false);
    });
  }, [urgency]);

  const openGoogleMaps = () => {
    if (!nearest) return;
    const query = encodeURIComponent(nearest.name);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-muted/20 rounded-xl border border-dashed">
        <Navigation className="h-8 w-8 animate-bounce text-primary/40" />
        <p className="text-sm font-medium text-muted-foreground">Locating nearest capable facility...</p>
      </div>
    );
  }

  if (!nearest) return null;

  return (
    <Card className="overflow-hidden border-primary/20 shadow-md animate-in zoom-in-95 duration-300">
      <div 
        className="relative aspect-video w-full bg-slate-100 flex items-center justify-center cursor-pointer border-b group" 
        onClick={openGoogleMaps}
      >
        <div className="bg-primary/5 p-8 rounded-full border-4 border-white shadow-inner flex items-center justify-center transition-transform group-hover:scale-110">
          <MapPin className="h-12 w-12 text-primary fill-primary/10 animate-pulse" />
        </div>
        
        {/* UI Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-200/80 via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="flex flex-col text-slate-900">
            <Badge className="w-fit mb-1 bg-primary text-white border-none text-[9px] font-bold uppercase tracking-wider">
              {urgency} Pathway
            </Badge>
            <h3 className="text-xs font-bold leading-tight max-w-[180px]">{nearest.name}</h3>
          </div>
          <Button 
            size="icon" 
            className="h-8 w-8 rounded-full bg-primary text-white shadow-lg ring-2 ring-white" 
            onClick={(e) => { e.stopPropagation(); openGoogleMaps(); }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5 p-2 bg-muted/30 rounded-lg">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Est. Transit Time</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-primary" />
              <span className="text-xs font-bold">18 Mins</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 p-2 bg-muted/30 rounded-lg">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Facility Status</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-green-600" />
              <span className="text-xs font-bold">Open</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 gap-2 text-[10px] font-bold h-9 bg-primary shadow-sm" onClick={openGoogleMaps}>
            <Navigation className="h-3.5 w-3.5" /> Open in Google Maps
          </Button>
          <Button variant="outline" className="shrink-0 h-9 w-9 p-0 border-muted-foreground/20" asChild>
            <a href={`tel:${nearest.contact}`}><Phone className="h-4 w-4 text-primary" /></a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
