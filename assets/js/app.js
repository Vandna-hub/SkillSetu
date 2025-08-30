// --- Demo data ---
const defaultProviders = [
  {id:1,name:"Aman Sharma",category:"Electrician",location:"Delhi",price:500,rating:4.7,img:"assets/img/electrician.svg",desc:"Licensed electrician for wiring, fans, lights & safety checks."},
  {id:2,name:"Priya Verma",category:"Tutor",location:"Mumbai",price:400,rating:4.8,img:"assets/img/tutor.svg",desc:"Math & Science tutor for Classes 6–10. First session free."},
  {id:3,name:"Rahul Iyer",category:"Designer",location:"Bengaluru",price:800,rating:4.6,img:"assets/img/designer.svg",desc:"UI/UX + logos. Quick turnarounds, Figma exports included."},
  {id:4,name:"Neha Gupta",category:"Chef",location:"Delhi",price:700,rating:4.9,img:"assets/img/plumber.svg",desc:"Home chef for North Indian & Jain meals. Party orders welcome."},
  {id:5,name:"Rakesh Yadav",category:"Plumber",location:"Pune",price:450,rating:4.4,img:"assets/img/plumber.svg",desc:"Leak fixes, fittings, bathroom installations. Same-day visits."},
  {id:6,name:"Simran Kaur",category:"Makeup Artist",location:"Jaipur",price:1200,rating:4.8,img:"assets/img/makeup.svg",desc:"Bridal & party makeup. On-location service with trial look."}
];

// Merge with any user-posted providers from localStorage
function loadProviders(){
  const extra = JSON.parse(localStorage.getItem("skillsetu_providers")||"[]");
  return [...defaultProviders, ...extra];
}

// --- Utility renderers ---
function stars(r){
  const full = "★".repeat(Math.floor(r));
  const half = r - Math.floor(r) >= 0.5 ? "½" : "";
  const empty = "☆".repeat(5 - Math.ceil(r));
  return `${full}${half}${empty}`;
}

function providerCard(p){
  return `<div class="col-12 col-sm-6 col-lg-4">
    <div class="card h-100 card-hover">
      <img src="${p.img}" 
      style="width:100px;height:100px;border-radius:50%;object-fit:cover;" 
      alt="${p.category}">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title mb-1">${p.name}</h5>
        <div class="text-secondary small mb-2">${p.category} • ${p.location}</div>
        <p class="card-text flex-grow-1">${p.desc}</p>
        <div class="d-flex justify-content-between align-items-center">
          <span class="price">₹${p.price}/hr</span>
          <span class="rating" title="${p.rating}">${stars(p.rating)} (${p.rating})</span>
        </div>
        <button class="btn btn-primary w-100 mt-3" data-id="${p.id}" data-name="${p.name}" data-bs-toggle="modal" data-bs-target="#hireModal">Hire</button>
      </div>
    </div>
  </div>`;
}

// --- Home page: quick search redirect ---
const quickSearch = document.getElementById("quickSearch");
if(quickSearch){
  quickSearch.addEventListener("submit",(e)=>{
    e.preventDefault();
    const q = document.getElementById("q").value.trim();
    const loc = document.getElementById("loc").value;
    const url = new URL("browse.html", window.location.href);
    if(q) url.searchParams.set("q", q);
    if(loc) url.searchParams.set("location", loc);
    window.location.href = url.toString();
  });

  // Render trending (top 3 by rating)
  const row = document.getElementById("cardsRow");
  const trending = loadProviders().sort((a,b)=>b.rating - a.rating).slice(0,3);
  row.innerHTML = trending.map(providerCard).join("");
}

// --- Browse page: filters & render ---
const results = document.getElementById("results");
if(results){
  const params = new URLSearchParams(window.location.search);
  const inputs = {
    search: document.getElementById("search"),
    category: document.getElementById("category"),
    location: document.getElementById("location"),
    sort: document.getElementById("sort"),
    minPrice: document.getElementById("minPrice"),
    maxPrice: document.getElementById("maxPrice"),
    minRating: document.getElementById("minRating"),
  };

  // seed from query params
  if(params.get("q")) inputs.search.value = params.get("q");
  if(params.get("category")) inputs.category.value = params.get("category");
  if(params.get("location")) inputs.location.value = params.get("location");

  function applyFilters(){
    const list = loadProviders().filter(p=>{
      const q = inputs.search.value.trim().toLowerCase();
      const matchQ = !q || [p.name,p.category,p.location,p.desc].join(" ").toLowerCase().includes(q);
      const matchCat = !inputs.category.value || p.category === inputs.category.value;
      const matchLoc = !inputs.location.value || p.location === inputs.location.value;
      const minP = inputs.minPrice.value ? Number(inputs.minPrice.value) : -Infinity;
      const maxP = inputs.maxPrice.value ? Number(inputs.maxPrice.value) : Infinity;
      const matchPrice = p.price >= minP && p.price <= maxP;
      const matchRating = p.rating >= Number(inputs.minRating.value || 0);
      return matchQ && matchCat && matchLoc && matchPrice && matchRating;
    });

    switch(inputs.sort.value){
      case "price-asc": list.sort((a,b)=>a.price-b.price); break;
      case "price-desc": list.sort((a,b)=>b.price-a.price); break;
      case "rating-desc": list.sort((a,b)=>b.rating-a.rating); break;
      default: list.sort((a,b)=>b.rating - a.rating); // featured
    }

    const no = document.getElementById("noResults");
    if(list.length===0){
      results.innerHTML = "";
      no.classList.remove("d-none");
    } else {
      no.classList.add("d-none");
      results.innerHTML = list.map(providerCard).join("");
    }

    // attach hire buttons
    document.querySelectorAll('[data-bs-target="#hireModal"]').forEach(btn=>{
      btn.addEventListener("click",()=>{
        document.getElementById("hireName").textContent = btn.dataset.name;
        document.getElementById("hireForm").dataset.providerId = btn.dataset.id;
        document.getElementById("hireSuccess").classList.add("d-none");
      });
    });
  }

  Object.values(inputs).forEach(el=> el && el.addEventListener("input", applyFilters));
  applyFilters();
}

// --- Hire form validation ---
const hireForm = document.getElementById("hireForm");
if(hireForm){
  hireForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    if(!hireForm.checkValidity()){
      hireForm.classList.add("was-validated");
      return;
    }
    hireForm.classList.remove("was-validated");
    document.getElementById("hireSuccess").classList.remove("d-none");
    hireForm.reset();
    setTimeout(()=>{
      const modalEl = document.getElementById('hireModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal && modal.hide();
    }, 1400);
  });
}

// --- Post form: save to localStorage then redirect ---
const postForm = document.getElementById("postForm");
if(postForm){
  postForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    if(!postForm.checkValidity()){
      postForm.classList.add("was-validated");
      return;
    }
    postForm.classList.remove("was-validated");
    const extra = JSON.parse(localStorage.getItem("skillsetu_providers")||"[]");
    const nextId = (Math.max(0,...defaultProviders.map(p=>p.id), ...extra.map(p=>p.id)) + 1);
    const item = {
      id: nextId,
      name: document.getElementById("p_name").value.trim(),
      category: document.getElementById("p_category").value,
      location: document.getElementById("p_location").value,
      price: Number(document.getElementById("p_price").value),
      rating: 4.5,
      img: iconFor(document.getElementById("p_category").value),
      desc: document.getElementById("p_desc").value.trim()
    };
    extra.push(item);
    localStorage.setItem("skillsetu_providers", JSON.stringify(extra));
    document.getElementById("postSuccess").classList.remove("d-none");
    setTimeout(()=> window.location.href = "browse.html?category=" + encodeURIComponent(item.category), 1200);
  });
}

function iconFor(cat){
  const map = {
    "Electrician":"assets/img/electrician.svg",
    "Plumber":"assets/img/plumber.svg",
    "Chef":"assets/img/chef.png",
    "Tutor":"assets/img/tutor.svg",
    "Designer":"assets/img/designer.svg",
    "Makeup Artist":"assets/img/makeup.svg",
    "Cleaner":"assets/img/cleaner.svg",
    "Carpenter":"assets/img/carpenter.svg",
  };
  return map[cat] || "assets/img/designer.svg";
}

// --- Contact form ---
const contactForm = document.getElementById("contactForm");
if(contactForm){
  contactForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    if(!contactForm.checkValidity()){
      contactForm.classList.add("was-validated");
      return;
    }
    contactForm.classList.remove("was-validated");
    document.getElementById("contactSuccess").classList.remove("d-none");
    contactForm.reset();
  });
}
// ---------------- Theme Toggle ----------------
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const body = document.body;

  // Load saved theme
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-theme");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      body.classList.toggle("dark-theme");
      localStorage.setItem("theme", body.classList.contains("dark-theme") ? "dark" : "light");
    });
  }
});
