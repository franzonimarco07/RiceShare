import { supabase } from '@/lib/supabase';
import { ApiError, errorResponse } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request, { params }) {
  try {
    const { author, slug } = await params;

    if (!author?.trim() || !slug?.trim()) {
      throw new ApiError(
        'BAD_REQUEST',
        'author and slug parameters are required',
        400
      );
    }

    const { data: rice, error: riceError } = await supabase
      .from('rice')
      .select('id, author_id, slug, status, installs')
      .eq('slug', slug)
      .single();

    if (riceError || !rice) {
      throw new ApiError(
        'NOT_FOUND',
        `Rice "${slug}" not found`,
        404,
        riceError?.message
      );
    }

    if (rice.status !== 'approved') {
      throw new ApiError(
        'FORBIDDEN',
        `Rice is ${rice.status}, not available for download`,
        403
      );
    }

    const filePath = `${rice.author_id}/${slug}/dotfiles-riceshare.zip`;
    const { data: fileData, error: dlError } = await supabase.storage
      .from('rice-files')
      .download(filePath);

    if (dlError) {
      throw new ApiError(
        'NOT_FOUND',
        'Dotfiles archive not found',
        404,
        dlError.message
      );
    }

    if (!fileData || fileData.size === 0) {
      throw new ApiError(
        'INTERNAL_ERROR',
        'Empty or corrupted dotfiles archive',
        500
      );
    }

    supabase
      .from('rice')
      .update({ installs: (rice.installs ?? 0) + 1 })
      .eq('id', rice.id)
      .then(() => console.log(`[${slug}] installs incremented`))
      .catch((err) => console.error(`[${slug}] Failed to update installs:`, err.message));

    return new Response(fileData, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${slug}-riceshare.zip"`,
        'Cache-Control': 'public, max-age=86400, immutable',
        'Content-Length': String(fileData.size),
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
}