
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
    const sanityclient = client

    sanityclient
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
    <div className="flex items-center gap-4">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Avatar"
          width={120}
          height={120}
          className="rounded-full"
        />
      ) : (
        <div className="w-32 h-32 bg-gray-200 rounded-full" />
      )}
      
      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={isLoading}
        />
        <span className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          {isLoading ? "Uploading..." : "Upload Photo"}
        </span>
      </label>
    </div>
  );
}