document.addEventListener("DOMContentLoaded", function () {
  // ====== Loader DOM ======
  const loader   = document.getElementById("loader");
  const pctEl    = document.getElementById("pct");     // contoh: <div id="pct">0%</div>
  const barEl    = document.getElementById("bar");     // contoh: <span id="bar"></span>

  function setProgress(p) {
    const clamped = Math.max(0, Math.min(100, Math.round(p)));
    if (pctEl) pctEl.textContent = clamped + "%";
    if (barEl) barEl.style.width = clamped + "%";
  }

  // ====== Rive: Header / PP ======
  const riveCanvas  = document.getElementById("rive-canvas");
  if (riveCanvas && window.rive) {
    new rive.Rive({
      src: "images/rive/ppnew.riv",
      canvas: riveCanvas,
      autoplay: true,
      artboard: "PP",
      stateMachines: "State Machine 1",
    });
  } else {
    console.error("Rive #1 tidak tersedia atau canvas tidak ditemukan.");
  }

  // ====== Rive: Scroll Spider (+mouse) ======
  const riveCanvas2 = document.getElementById("rive-canvas2");
  let riveInstance2 = null;
  let scrollInput = null;
  let inputX = null;
  let inputY = null;

  if (riveCanvas2 && window.rive) {
    riveInstance2 = new rive.Rive({
      src: "images/rive/scrollspiderUPDATE.riv",
      canvas: riveCanvas2,
      autoplay: true,
      artboard: "Artboard",
      stateMachines: "State Machine 1",
      onLoad: () => {
        const inputs = riveInstance2.stateMachineInputs("State Machine 1");
        // cari inputs sesuai nama di Rive
        inputX = inputs.find(i => i.name === "Number 1X");
        inputY = inputs.find(i => i.name === "Number 1Y");
        scrollInput = inputs.find(i => i.name === "ScrollSpider");

        if (!inputX || !inputY) console.warn("Input X/Y tidak ditemukan.");
        if (!scrollInput) console.warn("Input 'ScrollSpider' tidak ditemukan.");

        // mouse move -> update X/Y (0..100)
        document.addEventListener("mousemove", (e) => {
          if (!inputX || !inputY) return;
          const mappedX = (e.clientX / window.innerWidth) * 100;
          const mappedY = (e.clientY / window.innerHeight) * 100;
          inputX.value = mappedX;
          inputY.value = mappedY;
          riveInstance2.requestRender();
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
    riveInstance2?.requestRender();
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
  const gridContainer = document.querySelector(".grid");

  async function loadGrid() {
    if (!gridContainer) return;

    try {
      // Ambil data
      const response = await fetch("data.json", { cache: "no-cache" });
      const data = await response.json();

      // Render item
      gridContainer.innerHTML = "";
      data.forEach(item => {
        const el = document.createElement("div");
        el.className = "grid-item";
        el.innerHTML = `
          <a href="${item.link}" target="_blank" rel="noopener">
            <img src="${item.image}" alt="${item.title}">
            <h3>${item.title}</h3>
          </a>
          <div class="tags">
            ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
          </div>
        `;
        gridContainer.appendChild(el);
      });

      // Track progress semua gambar di grid
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
          isOriginTop: true,
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
});
