export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { author, slug } = await params;
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Cerca il rice nel DB per trovare l'author_id
  const { data: rice, error } = await supabase
    .from('rice')
    .select('author_id')
    .eq('slug', slug)
    .single();

  if (error || !rice) {
    return new Response('not found', { status: 404 });
  }

  // Scarica il file dallo storage — path: author_id/slug/dotfiles-riceshare.zip
  const { data, error: dlError } = await supabase.storage
    .from('rice-files')
    .download(`${rice.author_id}/${slug}/dotfiles-riceshare.zip`);

  if (dlError || !data) {
    return new Response('file not found', { status: 404 });
  }

  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slug}.zip"`,
      'Cache-Control': 'no-store',
    },
  });
}