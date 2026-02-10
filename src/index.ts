import { SpinePlayer } from '@esotericsoftware/spine-player';
import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';
import imagesLoaded from 'imagesloaded';
import Masonry from 'masonry-layout';
import '../styles.css';

document.addEventListener("DOMContentLoaded", function () {
  // ====== Loader DOM ======
  const loader = document.getElementById("loader");
  const pctEl = document.getElementById("pct");
  const barEl = document.getElementById("bar");

  function setProgress(p: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(p)));
    if (pctEl) pctEl.textContent = clamped + "%";
    if (barEl) barEl.style.width = clamped + "%";
  }

  // ====== Rive: Header / PP ======
  const riveCanvas = document.getElementById("rive-canvas") as HTMLCanvasElement;
  if (riveCanvas) {
    new Rive({
      src: "images/rive/ppnew.riv", // Parcel might need these handled too if you want them hashed, but keeping string for now if they are in public/images or static
      canvas: riveCanvas,
      autoplay: true,
      artboard: "PP",
      stateMachines: "State Machine 1",
    });
  } else {
    console.error("Rive #1 tidak tersedia atau canvas tidak ditemukan.");
  }

  // ====== Rive: Scroll Spider (+mouse) ======
  const riveCanvas2 = document.getElementById("rive-canvas2") as HTMLCanvasElement;
  let riveInstance2: Rive | null = null;
  let scrollInput: any = null;
  let inputX: any = null;
  let inputY: any = null;

  if (riveCanvas2) {
    riveInstance2 = new Rive({
      src: "images/rive/scrollspiderUPDATE.riv",
      canvas: riveCanvas2,
      autoplay: true,
      artboard: "Artboard",
      stateMachines: "State Machine 1",
      onLoad: () => {
        if (!riveInstance2) return;
        const inputs = riveInstance2.stateMachineInputs("State Machine 1");
        // cari inputs sesuai nama di Rive
        inputX = inputs.find(i => i.name === "Number 1X");
        inputY = inputs.find(i => i.name === "Number 1Y");
        scrollInput = inputs.find(i => i.name === "ScrollSpider");

        if (!inputX || !inputY) console.warn("Input X/Y tidak ditemukan.");
        if (!scrollInput) console.warn("Input 'ScrollSpider' tidak ditemukan.");

        // mouse move -> update X/Y (0..100)
        document.addEventListener("mousemove", (e) => {
          if (!inputX || !inputY || !riveInstance2) return;
          const mappedX = (e.clientX / window.innerWidth) * 100;
          const mappedY = (e.clientY / window.innerHeight) * 100;
          inputX.value = mappedX;
          inputY.value = mappedY;
          // riveInstance2.requestRender(); // Rive handles this automatically usually, but acceptable
        });
      },
    });
  } else {
    console.error("Rive #2 tidak tersedia atau canvas tidak ditemukan.");
  }

  // ====== Scroll -> update Rive number (0..100) ======
  function updateScrollInput() {
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - doc.clientHeight;
    if (maxScroll <= 0 || !scrollInput) return;

    const pct = (doc.scrollTop / maxScroll) * 100;
    scrollInput.value = pct;
    // riveInstance2?.requestRender();
  }

  let ticking = false;
  document.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScrollInput();
        ticking = false;
      });
      ticking = true;
    }
  });

  // ====== Grid + Progress Loader ======
  const gridContainer = document.querySelector(".grid") as HTMLElement;

  async function loadGrid() {
    if (!gridContainer) return;

    try {
      // Ambil data
      const response = await fetch("data.json", { cache: "no-cache" });
      const data = await response.json();

      // Render item
      gridContainer.innerHTML = "";
      data.forEach((item: any) => {
        const el = document.createElement("div");
        el.className = "grid-item";
        el.innerHTML = `
          <a href="${item.link}" target="_blank" rel="noopener">
            <img src="${item.image}" alt="${item.title}">
            <h3>${item.title}</h3>
          </a>
          <div class="tags">
            ${item.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join("")}
          </div>
        `;
        gridContainer.appendChild(el);
      });

      // Track progress semua gambar di grid
      // @ts-ignore
      const il = imagesLoaded(gridContainer);
      const total = il.images.length || 1;
      let loaded = 0;

      setProgress(0);
      il.on("progress", () => {
        loaded++;
        setProgress((loaded / total) * 100);
      });

      il.on("always", () => {
        // Init Masonry setelah SEMUA gambar siap
        new Masonry(gridContainer, {
          itemSelector: ".grid-item",
          columnWidth: ".grid-item",
          fitWidth: true,
          gutter: 10,
        });

        // Sembunyikan loader
        if (loader) loader.classList.add("hidden");
        // Sync pertama nilai scroll ke Rive
        updateScrollInput();
      });

      il.on("fail", () => {
        console.warn("Beberapa gambar gagal dimuat.");
      });

    } catch (err) {
      console.error("Error loading JSON:", err);
      gridContainer.innerHTML = "<p>Gagal memuat data. Coba lagi nanti.</p>";
      if (loader) loader.classList.add("hidden");
    }
  }

  loadGrid();

  // ====== Spine Player ======
  new SpinePlayer("spine", {
    jsonUrl: "spine/zzz-Recovered.json",
    atlasUrl: "spine/zzz-Recovered.atlas",
    animation: "idle",
    backgroundColor: "#00000000",
    alpha: true,
    showControls: false,
    success: (player: any) => {
      if (player && player.skeleton && player.skeleton.data && player.skeleton.data.animations) {
        console.log("Animations:", player.skeleton.data.animations.map((a: any) => a.name));
      }
    },
    error: (player: any, reason: any) => console.error("Spine error:", reason)
  });
});
