 import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req, { params }) {
  const { author, rice } = params;

  try {
    // Find the rice by slug
    const { data: riceData, error } = await supabase
      .from('rice')
      .select('*, users!author_id(username)')
      .eq('slug', `${author}-${rice}`)
      .eq('status', 'approved')
      .single();

    if (error || !riceData) {
      return new Response('# Rice not found\necho "Error: rice not found on riceshare.dev"', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Try to get install.sh from storage
    const { data: scriptData } = await supabase.storage
      .from('rice-files')
      .download(`${riceData.author_id}/${riceData.slug}/install.sh`);

    let script;
    if (scriptData) {
      script = await scriptData.text();
    } else {
      // Generate a basic script from metadata
      script = generateBasicScript(riceData);
    }

    // Increment install counter
    await supabase
      .from('rice')
      .update({ installs: (riceData.installs || 0) + 1 })
      .eq('id', riceData.id);

    return new Response(script, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (e) {
    return new Response('echo "Error fetching rice"', { status: 500 });
  }
}

function generateBasicScript(rice) {
  const deps = (rice.deps || []).join(' ');
  return `#!/bin/bash
# ${rice.title} — installed via riceshare.dev
# Author: ${rice.users?.username || 'unknown'}
# WM: ${rice.wm || 'unknown'}

set -e

echo "Installing ${rice.title}..."

# Detect package manager
if command -v pacman &>/dev/null; then
  PKG="pacman -S --noconfirm --needed"
elif command -v apt &>/dev/null; then
  PKG="apt install -y"
elif command -v dnf &>/dev/null; then
  PKG="dnf install -y"
elif command -v xbps-install &>/dev/null; then
  PKG="xbps-install -y"
else
  echo "Unsupported package manager"; exit 1
fi

# Backup existing config
BACKUP=~/.rice-backup/$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP"
[ -d ~/.config/${rice.wm} ] && cp -r ~/.config/${rice.wm} "$BACKUP/"

# Install dependencies
${deps ? `sudo $PKG ${deps}` : '# no dependencies specified'}

echo "Done! ${rice.title} installed successfully."
echo "Backup saved to $BACKUP"
`;
}
