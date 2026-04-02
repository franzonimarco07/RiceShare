import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // ← non la service role key
);

const PKG_MAP = {
  "ttf-ibm-plex":  { apt:"fonts-ibm-plex",           dnf:"ibm-plex-fonts",  pacman:"ttf-ibm-plex"  },
  "nerd-fonts":    { apt:"fonts-nerd-fonts-complete", dnf:"nerd-fonts",      pacman:"nerd-fonts"    },
  "hyprpaper":     { apt:"hyprpaper",                 dnf:"hyprpaper",       pacman:"hyprpaper"     },
  "grim":          { apt:"grim",                      dnf:"grim",            pacman:"grim"          },
  "slurp":         { apt:"slurp",                     dnf:"slurp",           pacman:"slurp"         },
  "waybar":        { apt:"waybar",                    dnf:"waybar",          pacman:"waybar"        },
  "wofi":          { apt:"wofi",                      dnf:"wofi",            pacman:"wofi"          },
  "rofi":          { apt:"rofi",                      dnf:"rofi",            pacman:"rofi"          },
  "dunst":         { apt:"dunst",                     dnf:"dunst",           pacman:"dunst"         },
  "kitty":         { apt:"kitty",                     dnf:"kitty",           pacman:"kitty"         },
  "alacritty":     { apt:"alacritty",                 dnf:"alacritty",       pacman:"alacritty"     },
  "hyprland":      { apt:"hyprland",                  dnf:"hyprland",        pacman:"hyprland"      },
  "sway":          { apt:"sway",                      dnf:"sway",            pacman:"sway"          },
  "waybar":        { apt:"waybar",                    dnf:"waybar",          pacman:"waybar"        },
  "neovim":        { apt:"neovim",                    dnf:"neovim",          pacman:"neovim"        },
  "tmux":          { apt:"tmux",                      dnf:"tmux",            pacman:"tmux"          },
  "fzf":           { apt:"fzf",                       dnf:"fzf",             pacman:"fzf"           },
  "starship":      { apt:"starship",                  dnf:"starship",        pacman:"starship"      },
  "swww":          { apt:"swww",                      dnf:"swww",            pacman:"swww"          },
  "zoxide":        { apt:"zoxide",                    dnf:"zoxide",          pacman:"zoxide"        },
  "eza":           { apt:"eza",                       dnf:"eza",             pacman:"eza"           },
  "bat":           { apt:"bat",                       dnf:"bat",             pacman:"bat"           },
};

export async function GET(request, { params }) {
  const { author, slug } = params;

  // Fetch rice dal DB
  const { data: rice, error } = await supabase
    .from('rice')
    .select('*, users(username)')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();

  if (error || !rice) {
    return new Response(`#!/usr/bin/env bash\necho "// error: rice '${slug}' not found"\nexit 1\n`, {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const deps = rice.deps || [];
  const pkgFor = (pm) => deps.map(d => PKG_MAP[d]?.[pm] || d).join(' ');
  const BASE = 'https://rice-share.vercel.app';

  const script = `#!/usr/bin/env bash
# // riceshare — ${author}/${slug}
# // auto-generated universal install script

set -euo pipefail
GREEN='\\033[0;32m'; DIM='\\033[2m'; NC='\\033[0m'
echo -e "\\n\${GREEN}// riceshare installer\${NC}"
echo -e "\${DIM}// ${author}/${slug}\\n\${NC}"

# // detect package manager
if   command -v pacman &>/dev/null; then
  echo -e "\${DIM}// arch-based distro detected\${NC}"
  command -v yay &>/dev/null && AUR=yay || AUR=pacman
  \$AUR -S --needed --noconfirm ${pkgFor('pacman')}
elif command -v apt &>/dev/null; then
  echo -e "\${DIM}// debian/ubuntu detected\${NC}"
  sudo apt update -qq && sudo apt install -y ${pkgFor('apt')}
elif command -v dnf &>/dev/null; then
  echo -e "\${DIM}// fedora detected\${NC}"
  sudo dnf install -y ${pkgFor('dnf')}
elif command -v zypper &>/dev/null; then
  echo -e "\${DIM}// opensuse detected\${NC}"
  sudo zypper install -y ${pkgFor('pacman')}
elif command -v xbps-install &>/dev/null; then
  echo -e "\${DIM}// void linux detected\${NC}"
  sudo xbps-install -y ${pkgFor('pacman')}
else
  echo "// error: unsupported package manager"; exit 1
fi

# // increment install counter
curl -fsSL -X POST "${BASE}/api/rice/${rice.id}/install" &>/dev/null &

# // backup existing config
BACKUP=~/.rice-backup-\$(date +%s)
mkdir -p "\$BACKUP"
cp -r ~/.config "\$BACKUP/" 2>/dev/null || true
echo -e "\${DIM}// backup saved to \$BACKUP\${NC}"

# // download and apply dotfiles
TMP=\$(mktemp -d)
curl -fsSL "${BASE}/api/v1/rice/${author}/${slug}/download" -o "\$TMP/rice.zip"
unzip -q "\$TMP/rice.zip" -d "\$TMP"
[ -d "\$TMP/dotfiles" ] && cp -r "\$TMP/dotfiles/." ~/.config/ 2>/dev/null || true
[ -f "\$TMP/dotfiles/.zshrc" ]        && cp "\$TMP/dotfiles/.zshrc" ~/
[ -f "\$TMP/dotfiles/wallpaper.png" ] && cp "\$TMP/dotfiles/wallpaper.png" ~/
rm -rf "\$TMP"

echo -e "\\n\${GREEN}// done! restart your session to apply the rice.\${NC}\\n"
`;

  // Aggiorna contatore installs
  await supabase
    .from('rice')
    .update({ installs: (rice.installs || 0) + 1 })
    .eq('id', rice.id);

  return new Response(script, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}