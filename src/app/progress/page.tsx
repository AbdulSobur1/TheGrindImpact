'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { getProgressPhotos, uploadProgressPhoto, getMeasurements, saveMeasurements } from '@/lib/actions';
import { Camera, Scale, Calendar, TrendingUp, Plus, X } from 'lucide-react';
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-[#C8FF00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#F5F5F5]">PROGRESS</h1>
        <p className="text-[#888888] text-sm font-medium mt-1">Track your transformation over time</p>
      </div>

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
            <p className="text-xs text-[#888888] font-medium">{photos.length} photos taken</p>
            <Button size="sm" onClick={() => setShowUpload(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              ADD PHOTO
            </Button>
          </div>

          {/* Upload form */}
          {showUpload && (
            <Card className="border-[#C8FF00]/20 bg-[#C8FF00]/3 animate-slide-up">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold uppercase tracking-wider text-[#C8FF00]">NEW PROGRESS PHOTO</p>
                  <button onClick={() => setShowUpload(false)} className="text-[#888888] hover:text-[#F5F5F5]">
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
                          ? 'border-[#C8FF00]/30 bg-[#C8FF00]/10 text-[#C8FF00]'
                          : 'border-[#222222] bg-[#1C1C1C] text-[#888888] hover:border-[#3F3F3F]'
                      }`}
                    >
                      {bp.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center justify-center gap-3 px-4 py-6 rounded-xl border-2 border-dashed border-[#222222] cursor-pointer hover:border-[#3F3F3F] transition-colors">
                  <Camera className="h-5 w-5 text-[#666666]" />
                  <span className="text-sm text-[#888888] font-medium">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <Card key={photo.id} className="border-[#222222] overflow-hidden group">
                <div className="aspect-[3/4] bg-[#1C1C1C] relative">
                  <img
                    src={photo.photo_url}
                    alt={photo.body_part}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#080808]/80 to-transparent p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#C8FF00]">
                      {BODY_PARTS.find((bp) => bp.value === photo.body_part)?.label || photo.body_part}
                    </p>
                    <p className="text-[9px] text-[#888888]">{photo.taken_at}</p>
                  </div>
                </div>
              </Card>
            ))}
            {photos.length === 0 && !showUpload && (
              <div className="col-span-full py-12 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-[#1C1C1C] flex items-center justify-center">
                    <Camera className="h-8 w-8 text-[#666666]" />
                  </div>
                </div>
                <p className="text-lg font-black uppercase tracking-tight text-[#F5F5F5] mb-1">No photos yet</p>
                <p className="text-sm text-[#888888] font-medium">Start tracking your transformation.</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'measurements' && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#888888] font-medium">{measurements.length} entries</p>
            <Button size="sm" onClick={() => setShowMeasureForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              LOG MEASUREMENTS
            </Button>
          </div>

          {/* Latest comparison */}
          {latestMeasure && (
            <Card className="border-[#222222]">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-[#888888]">
                  Latest — {latestMeasure.measured_at}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Weight', key: 'weight_kg', unit: 'kg', color: '#C8FF00' },
                    { label: 'Chest', key: 'chest_cm', unit: 'cm', color: '#30D158' },
                    { label: 'Waist', key: 'waist_cm', unit: 'cm', color: '#FF9500' },
                    { label: 'Hips', key: 'hips_cm', unit: 'cm', color: '#FF3B30' },
                    { label: 'Arms', key: 'arms_cm', unit: 'cm', color: '#C8FF00' },
                    { label: 'Thighs', key: 'thighs_cm', unit: 'cm', color: '#30D158' },
                    { label: 'Glutes', key: 'glutes_cm', unit: 'cm', color: '#FF9500' },
                    { label: 'Body Fat', key: 'body_fat_pct', unit: '%', color: '#FF3B30' },
                  ].map((metric) => {
                    const current = (latestMeasure as any)[metric.key];
                    const previous = prevMeasure ? (prevMeasure as any)[metric.key] : null;
                    const change = diff(current, previous);
                    return (
                      <div key={metric.key} className="px-4 py-3 rounded-xl bg-[#1C1C1C] border border-[#222222]">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#666666]">{metric.label}</p>
                        <p className="text-lg font-black text-[#F5F5F5]" style={{ color: current ? metric.color : '#666666' }}>
                          {current != null ? `${current} ${metric.unit}` : '—'}
                        </p>
                        {change && (
                          <span className={`text-[10px] font-bold ${change.startsWith('+') ? 'text-[#30D158]' : 'text-[#FF3B30]'}`}>
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
            <Card className="border-[#C8FF00]/20 bg-[#C8FF00]/3 animate-slide-up">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold uppercase tracking-wider text-[#C8FF00]">LOG MEASUREMENTS</p>
                  <button onClick={() => setShowMeasureForm(false)} className="text-[#888888] hover:text-[#F5F5F5]">
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
                    <div key={field.key} className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-[#888888]">{field.label}</label>
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
            <Card className="border-[#222222]">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-[#888888]">History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {measurements.slice(0, 10).map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-6 py-3 border-t border-[#222222] text-xs">
                    <span className="font-bold text-[#F5F5F5]">{m.measured_at}</span>
                    <div className="flex gap-4">
                      {m.weight_kg && <span className="text-[#888888]">{m.weight_kg} kg</span>}
                      {m.chest_cm && <span className="text-[#888888]">{m.chest_cm} cm</span>}
                      {m.body_fat_pct && <span className="text-[#888888]">{m.body_fat_pct}%</span>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {measurements.length === 0 && !showMeasureForm && (
            <div className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-[#1C1C1C] flex items-center justify-center">
                  <Scale className="h-8 w-8 text-[#666666]" />
                </div>
              </div>
              <p className="text-lg font-black uppercase tracking-tight text-[#F5F5F5] mb-1">No measurements yet</p>
              <p className="text-sm text-[#888888] font-medium">Log your first measurements to track progress.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
