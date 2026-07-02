import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, ImagePlus, X, Loader2 } from 'lucide-react';
import { getPhotos, uploadPhoto, deletePhoto } from '../lib/storage';
import ConfirmDialog from './ConfirmDialog';
import Spinner from './Spinner';

const MAX_PX = 1200;
const QUALITY = 0.75;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round((height * MAX_PX) / width); width = MAX_PX; }
        else { width = Math.round((width * MAX_PX) / height); height = MAX_PX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', QUALITY));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function PhotoGallery() {
  const { data: photos = [], isLoading } = useQuery({ queryKey: ['photos'], queryFn: getPhotos });
  const queryClient = useQueryClient();
  const fileRef = useRef();
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, path }
  const [preview, setPreview]           = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['photos'] });

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      setUploadStatus(`Uploading ${i + 1} / ${files.length}…`);
      try {
        const dataUrl = await compressImage(files[i]);
        await uploadPhoto(dataUrl, files[i].name);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    await invalidate();
    setUploading(false);
    setUploadStatus('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deletePhoto(deleteTarget.id, deleteTarget.path);
    setDeleteTarget(null);
    invalidate();
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Photo"
        message="Delete this photo? This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20">
            <X size={22} />
          </button>
          <img src={preview} alt="" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col items-center justify-center gap-3">
          <Loader2 size={36} className="text-white animate-spin" />
          <p className="text-white font-medium text-sm">{uploadStatus}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
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
                <p className="text-white text-xs">{new Date(photo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <button
                onClick={() => setDeleteTarget({ id: photo.id, path: photo.path })}
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
