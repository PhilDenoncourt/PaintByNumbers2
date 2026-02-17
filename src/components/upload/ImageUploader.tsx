import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '../../state/appStore';
import { sessionStorage } from '../../utils/sessionStorage';

export function ImageUploader() {
  const loadImage = useAppStore((s) => s.loadImage);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback(
    async (file: File) => {
      await loadImage(file);
    },
    [loadImage]
  );

  const handleSessionFile = useCallback(async (file: File) => {
    try {
      const session = await sessionStorage.importFromFile(file);

      // Load image from base64
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas');

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        // Set state
        const url = canvas.toDataURL('image/png');
        useAppStore.setState({
          sourceImageUrl: url,
          sourceImageData: imageData,
          processedWidth: imageData.width,
          processedHeight: imageData.height,
          settings: session.settings,
          result: session.result,
        });
      };
      img.src = session.sourceImageBase64;
    } catch (err) {
      alert(`Failed to load session: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type.startsWith('image/')) {
        await handleImageFile(file);
      } else if (file.name.endsWith('.json') || file.type === 'application/json') {
        await handleSessionFile(file);
      }
    },
    [handleImageFile, handleSessionFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleImageFile(file);
          break;
        }
      }
    },
    [handleImageFile]
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 cursor-pointer transition-colors ${
        dragOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
      }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onPaste={onPaste}
      onClick={() => inputRef.current?.click()}
      tabIndex={0}
    >
      <svg
        className="w-12 h-12 text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className="text-gray-600 font-medium mb-1">
        Drop an image or saved session here, or click to browse
      </p>
      <p className="text-gray-400 text-sm">
        Images: JPEG, PNG, WebP. Sessions: .json files. You can also paste images from clipboard.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.json"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}
