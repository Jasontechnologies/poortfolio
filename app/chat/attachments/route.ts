import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/supabase/feature-flags';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/json',
  'application/zip',
  'application/x-zip-compressed'
]);

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const isChatEnabled = await isFeatureEnabled('chat_enabled', supabase);
  if (!isChatEnabled) {
    return NextResponse.json({ error: 'Chat is temporarily unavailable.' }, { status: 503 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }
  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: 'Verify your email before uploading files.' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
  }

  const path = `${user.id}/${Date.now()}-${sanitizeFilename(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from('chat-attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return NextResponse.json({ error: signedUrlError?.message ?? 'Failed to sign upload URL.' }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    attachment: {
      path,
      url: signedUrlData.signedUrl,
      type: file.type,
      size: file.size,
      name: file.name
    }
  });
}
