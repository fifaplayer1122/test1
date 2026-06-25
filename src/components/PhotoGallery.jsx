import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, ImagePlus, X } from 'lucide-react';
import { getPhotos, savePhotos } from '../lib/storage';
import ConfirmDialog from './ConfirmDialog';
import Spinner from './Spinner';

export default function PhotoGallery() {
  const { data: photos = [], isLoading } = useQuery({ queryKey: ['photos'], queryFn: getPhotos });
  const queryClient = useQueryClient();
  const fileRef  = useRef();
  const [deleteId, setDeleteId]   = useState(null);
  const [preview, setPreview]     = useState(null); // full-screen preview

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['photos'] });

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const current = getPhotos();
    let pending = files.length;
    const newPhotos = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newPhotos.push({ id: crypto.randomUUID(), image_url: ev.target.result, caption: '', created_date: new Date().toISOString() });
        if (--pending === 0) { savePhotos([...current, ...newPhotos]); invalidate(); }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const deletePhoto = (id) => { savePhotos(getPhotos().filter(p => p.id !== id)); invalidate(); };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Photo"
        message="Delete this photo? This cannot be undone."
        onConfirm={() => { deletePhoto(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />

      {/* Full-screen preview */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20">
            <X size={22} />
          </button>
          <img src={preview} alt="" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ImagePlus size={16} /> Add Photos
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} />
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-20">
          <ImagePlus size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium text-sm">No office photos yet.</p>
          <p className="text-gray-400 text-xs mt-1">Tap "Add Photos" to upload.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {photos.map(photo => (
            <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
              <img
                src={photo.image_url}
                alt=""
                className="object-cover w-full h-full cursor-pointer"
                onClick={() => setPreview(photo.image_url)}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                <p className="text-white text-xs">{new Date(photo.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              {/* Delete — always visible on mobile, hover on desktop */}
              <button
                onClick={() => setDeleteId(photo.id)}
                className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
