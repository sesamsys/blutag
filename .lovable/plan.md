

# Add Dark Mode with System Preference Detection

## Changes

### 1. `index.html` — inline dark mode script
Add before `</head>`:
```js
<script>
  (function(){
    if(window.matchMedia('(prefers-color-scheme:dark)').matches) 
      document.documentElement.classList.add('dark');
    window.matchMedia('(prefers-color-scheme:dark)')
      .addEventListener('change',e=>document.documentElement.classList.toggle('dark',e.matches));
  })();
</script>
```

### 2. `src/index.css` — update `.dark` variables
Match Bluesky's actual dark palette:
- **Background**: `#151D28` → `216 30% 12%`
- **Card/Popover**: slightly lighter, ~`216 25% 15%`
- **Foreground**: pure white `0 0% 100%`
- **Muted foreground**: `rgb(171,184,201)` → `214 20% 73%`
- **Border/input**: `216 25% 20%`
- **Muted/accent bg**: `216 25% 17%`
- **Primary**: unchanged (Bluesky blue)
- **Destructive**: adjusted for dark

### 3. No component changes
All components use semantic classes (`bg-background`, `text-foreground`, etc.) — they adapt automatically.

## Files
- `index.html` — add script
- `src/index.css` — refine `.dark` block

