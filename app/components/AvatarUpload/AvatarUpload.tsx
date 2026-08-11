"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { client } from "@/sanity/lib/client";

interface AvatarUploadProps {
  userId: string;
}

export function AvatarUpload({ userId }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current avatar on mount
  useEffect(() => {
    client
      .fetch(
        `*[_type == "user" && _id == $userId][0]{
          avatar{asset->{url}}
        }`,
        { userId }
      )
      .then((data) => {
        if (data?.avatar?.asset?.url) {
          setAvatarUrl(data.avatar.asset.url);
        }
      });
  }, [userId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setAvatarUrl(url);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Avatar"
          width={112}
          height={112}
          className="h-28 w-28 rounded-full object-cover ring-2 ring-gray-100"
        />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gray-100 text-gray-400 ring-2 ring-gray-100 dark:bg-gray-800">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              fill="currentColor"
            />
          </svg>
        </div>
      )}

      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={isLoading}
        />
        <span className="inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-60">
          {isLoading ? "Uploading…" : "Upload Photo"}
        </span>
      </label>
    </div>
  );
}
