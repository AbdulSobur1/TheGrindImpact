'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { getProgressPhotos, uploadProgressPhoto, getMeasurements, saveMeasurements } from '@/lib/actions';
import { Camera, Scale, Calendar, TrendingUp, Plus, X, Weight } from 'lucide-react';
import type { ProgressPhoto, Measurement } from '@/types';

const BODY_PARTS = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'side', label: 'Side' },
  { value: 'arms', label: 'Arms' },
  { value: 'legs', label: 'Legs' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'abs', label: 'Abs' },
  { value: 'full', label: 'Full Body' },
];

export default function ProgressPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [activeTab, setActiveTab] = useState<'photos' | 'measurements'>('photos');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBodyPart, setSelectedBodyPart] = useState('front');
  const [uploading, setUploading] = useState(false);
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [measureData, setMeasureData] = useState({
    weight_kg: '',
    chest_cm: '',
    waist_cm: '',
    hips_cm: '',
    arms_cm: '',
    thighs_cm: '',
    glutes_cm: '',
    body_fat_pct: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    const [p, m] = await Promise.all([getProgressPhotos(), getMeasurements()]);
    setPhotos(p);
    setMeasurements(m);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('body_part', selectedBodyPart);
    const result = await uploadProgressPhoto(formData);
    if (!result.error) {
      setShowUpload(false);
      setSelectedFile(null);
      loadData();
    }
    setUploading(false);
  }

  async function handleSaveMeasurements() {
    const data: any = {};
    Object.entries(measureData).forEach(([key, val]) => {
      if (val) data[key] = parseFloat(val);
    });
    const result = await saveMeasurements(data);
    if (!result.error) {
      setShowMeasureForm(false);
      setMeasureData({
        weight_kg: '', chest_cm: '', waist_cm: '', hips_cm: '',
        arms_cm: '', thighs_cm: '', glutes_cm: '', body_fat_pct: '',
      });
      loadData();
    }
  }

  const latestMeasure = measurements[0];
  const prevMeasure = measurements[1];

  const diff = (current?: number | null, previous?: number | null) => {
    if (current == null || previous == null) return null;
    const d = current - previous;
    return d === 0 ? null : d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1);
  };

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-8 animate-fade-in">
        <div className="space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <hr className="hr-accent" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-[#242424] bg-[#141414] overflow-hidden">
              <Skeleton className="aspect-[3/4] w-full rounded-none" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase text-white">PROGRESS</h1>
        <p className="text-[#999999] text-sm font-medium mt-1">Track your transformation over time</p>
      </div>

      <hr className="hr-accent" />

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'photos' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('photos')}
          className="gap-2"
        >
          <Camera className="h-4 w-4" />
          PHOTOS
        </Button>
        <Button
          variant={activeTab === 'measurements' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('measurements')}
          className="gap-2"
        >
          <Scale className="h-4 w-4" />
          MEASUREMENTS
        </Button>
      </div>

      <Separator />

      {activeTab === 'photos' && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#999999] font-medium">{photos.length} photos taken</p>
            <Button size="sm" onClick={() => setShowUpload(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              ADD PHOTO
            </Button>
          </div>

          {/* Upload form */}
          {showUpload && (
            <Card className="border-[#FF5C00]/20 bg-[#FF5C00]/3 animate-slide-up">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold uppercase tracking-wider text-[#FF5C00]">NEW PROGRESS PHOTO</p>
                  <button onClick={() => setShowUpload(false)} className="text-[#999999] hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {BODY_PARTS.map((bp) => (
                    <button
                      key={bp.value}
                      onClick={() => setSelectedBodyPart(bp.value)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                        selectedBodyPart === bp.value
                          ? 'border-[#FF5C00]/30 bg-[#FF5C00]/10 text-[#FF5C00]'
                          : 'border-[#242424] bg-[#1A1A1A] text-[#999999] hover:border-[#3F3F3F]'
                      }`}
                    >
                      {bp.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center justify-center gap-3 px-4 py-6 rounded-xl border-2 border-dashed border-[#242424] cursor-pointer hover:border-[#3F3F3F] transition-colors">
                  <Camera className="h-5 w-5 text-[#555555]" />
                  <span className="text-sm text-[#999999] font-medium">
                    {selectedFile ? selectedFile.name : 'Choose photo...'}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </label>
                <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full h-11">
                  {uploading ? 'UPLOADING...' : 'UPLOAD PHOTO'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Photo grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="border-[#242424] overflow-hidden group hover:scale-[1.02] transition-all duration-200">
                <div className="aspect-[3/4] bg-[#1A1A1A] relative">
                  <img
                    src={photo.photo_url}
                    alt={photo.body_part}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0D0D0D]/80 to-transparent p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF5C00]">
                      {BODY_PARTS.find((bp) => bp.value === photo.body_part)?.label || photo.body_part}
                    </p>
                    <p className="text-[9px] text-[#999999]">{photo.taken_at}</p>
                  </div>
                </div>
              </Card>
            ))}
            {photos.length === 0 && !showUpload && (
              <div className="col-span-full py-12 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center border border-[#242424]">
                    <Camera className="h-8 w-8 text-[#555555]" />
                  </div>
                </div>
                <p className="text-lg font-black uppercase tracking-tight text-white mb-1">No photos yet</p>
                <p className="text-sm text-[#999999] font-medium">Start tracking your transformation.</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'measurements' && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#999999] font-medium">{measurements.length} entries</p>
            <Button size="sm" onClick={() => setShowMeasureForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              LOG MEASUREMENTS
            </Button>
          </div>

          {/* Latest comparison */}
          {latestMeasure && (
            <Card className="border-[#242424]">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#999999]">
                  Latest — {latestMeasure.measured_at}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Weight', key: 'weight_kg', unit: 'kg', color: '#FF5C00' },
                    { label: 'Chest', key: 'chest_cm', unit: 'cm', color: '#34C759' },
                    { label: 'Waist', key: 'waist_cm', unit: 'cm', color: '#FF9F0A' },
                    { label: 'Hips', key: 'hips_cm', unit: 'cm', color: '#FF3B30' },
                    { label: 'Arms', key: 'arms_cm', unit: 'cm', color: '#FF5C00' },
                    { label: 'Thighs', key: 'thighs_cm', unit: 'cm', color: '#34C759' },
                    { label: 'Glutes', key: 'glutes_cm', unit: 'cm', color: '#FF9F0A' },
                    { label: 'Body Fat', key: 'body_fat_pct', unit: '%', color: '#FF3B30' },
                  ].map((metric) => {
                    const current = (latestMeasure as any)[metric.key];
                    const previous = prevMeasure ? (prevMeasure as any)[metric.key] : null;
                    const change = diff(current, previous);
                    return (
                      <div key={metric.key} className="px-4 py-3 rounded-xl bg-[#1A1A1A] border border-[#242424]">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#555555]">{metric.label}</p>
                        <p className="text-lg font-black text-white" style={{ color: current ? metric.color : '#555555' }}>
                          {current != null ? `${current} ${metric.unit}` : '—'}
                        </p>
                        {change && (
                          <span className={`text-[10px] font-bold ${change.startsWith('+') ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                            {change}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Measurement form */}
          {showMeasureForm && (
            <Card className="border-[#FF5C00]/20 bg-[#FF5C00]/3 animate-slide-up">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold uppercase tracking-wider text-[#FF5C00]">LOG MEASUREMENTS</p>
                  <button onClick={() => setShowMeasureForm(false)} className="text-[#999999] hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Weight (kg)', key: 'weight_kg' },
                    { label: 'Chest (cm)', key: 'chest_cm' },
                    { label: 'Waist (cm)', key: 'waist_cm' },
                    { label: 'Hips (cm)', key: 'hips_cm' },
                    { label: 'Arms (cm)', key: 'arms_cm' },
                    { label: 'Thighs (cm)', key: 'thighs_cm' },
                    { label: 'Glutes (cm)', key: 'glutes_cm' },
                    { label: 'Body Fat %', key: 'body_fat_pct' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-[#999999]">{field.label}</label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={(measureData as any)[field.key]}
                        onChange={(e) => setMeasureData({ ...measureData, [field.key]: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveMeasurements} className="w-full h-11">
                  SAVE MEASUREMENTS
                </Button>
              </CardContent>
            </Card>
          )}

          {/* History */}
          {measurements.length > 1 && (
            <Card className="border-[#242424]">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#999999]">History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {measurements.slice(0, 10).map((m, i) => (
                  <div key={m.id} className={`flex items-center justify-between px-5 py-3 ${i > 0 ? 'border-t border-[#242424]' : ''} hover:bg-[#1A1A1A]/50 transition-colors`}>
                    <span className="font-bold text-sm text-white">{m.measured_at}</span>
                    <div className="flex gap-4 text-xs">
                      {m.weight_kg && <span className="text-[#999999]">{m.weight_kg} kg</span>}
                      {m.chest_cm && <span className="text-[#999999]">{m.chest_cm} cm</span>}
                      {m.body_fat_pct && <span className="text-[#999999]">{m.body_fat_pct}%</span>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {measurements.length === 0 && !showMeasureForm && (
            <div className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center border border-[#242424]">
                  <Scale className="h-8 w-8 text-[#555555]" />
                </div>
              </div>
              <p className="text-lg font-black uppercase tracking-tight text-white mb-1">No measurements yet</p>
              <p className="text-sm text-[#999999] font-medium">Log your first measurements to track progress.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
