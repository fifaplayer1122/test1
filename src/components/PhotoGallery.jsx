import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, ImagePlus } from 'lucide-react';
import { getPhotos, savePhotos } from '../lib/storage';
import ConfirmDialog from './ConfirmDialog';
import Spinner from './Spinner';

export default function PhotoGallery() {
  const { data: photos = [], isLoading } = useQuery({ queryKey: ['photos'], queryFn: getPhotos });
  const queryClient = useQueryClient();
  const fileRef = useRef();
  const [deleteId, setDeleteId] = useState(null);

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
        newPhotos.push({
          id: crypto.randomUUID(),
          image_url: ev.target.result,
          caption: '',
          created_date: new Date().toISOString(),
        });
        pending--;
        if (pending === 0) {
          savePhotos([...current, ...newPhotos]);
          invalidate();
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const deletePhoto = (id) => {
    savePhotos(getPhotos().filter(p => p.id !== id));
    invalidate();
  };

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
      <div className="flex justify-end mb-4">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <ImagePlus size={16} />
          Add Photos
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} />
      </div>
      {photos.length === 0 ? (
        <div className="text-center text-gray-400 py-16 text-sm">No office photos yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
              <img src={photo.image_url} alt="" className="object-cover w-full h-full" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                {new Date(photo.created_date).toLocaleDateString()}
              </div>
              <button
                onClick={() => setDeleteId(photo.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded p-1"
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
