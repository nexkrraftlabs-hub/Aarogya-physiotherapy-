/* Aarogya Physiotherapy — shared behaviour */
(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("site-menu");
  var backdrop = document.querySelector(".menu-backdrop");

  function setMenu(open) {
    body.classList.toggle("menu-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(!body.classList.contains("menu-open"));
    });
    if (backdrop) backdrop.addEventListener("click", function () { setMenu(false); });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && body.classList.contains("menu-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 1101px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------- FAQ accordion (one open at a time) ---------- */
  var faqButtons = document.querySelectorAll(".faq-q");
  faqButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      faqButtons.forEach(function (other) {
        other.setAttribute("aria-expanded", "false");
        document.getElementById(other.getAttribute("aria-controls")).classList.remove("is-open");
      });
      if (!expanded) {
        btn.setAttribute("aria-expanded", "true");
        document.getElementById(btn.getAttribute("aria-controls")).classList.add("is-open");
      }
    });
  });

  /* ---------- Testimonials slider ---------- */
  var wrap = document.querySelector(".t-wrap");
  if (wrap) {
    var track = wrap.querySelector(".t-track");
    var prev = document.querySelector(".t-nav .is-prev");
    var next = document.querySelector(".t-nav .is-next");

    var step = function () {
      var card = track.querySelector(".t-card");
      return card ? card.getBoundingClientRect().width + 17 : track.clientWidth;
    };
    var update = function () {
      var atStart = track.scrollLeft <= 4;
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      wrap.classList.toggle("is-start", atStart);
      wrap.classList.toggle("is-end", atEnd);
      if (prev) prev.disabled = atStart;
      if (next) next.disabled = atEnd;
    };
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Video modal ----------
     Put a YouTube/Vimeo embed URL in data-video on any .js-video button.
     Without data-video the button does nothing. */
  var modal;
  function openVideo(src) {
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "Video");
      modal.innerHTML =
        '<div class="modal__box"><button class="modal__close" type="button" aria-label="Close video">&times;</button><iframe allow="autoplay; fullscreen" allowfullscreen title="Video"></iframe></div>';
      body.appendChild(modal);
      modal.addEventListener("click", function (e) {
        if (e.target === modal || e.target.closest(".modal__close")) closeVideo();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && modal.classList.contains("is-open")) closeVideo();
      });
    }
    modal.querySelector("iframe").src = src + (src.indexOf("?") > -1 ? "&" : "?") + "autoplay=1";
    modal.classList.add("is-open");
    modal.querySelector(".modal__close").focus();
  }
  function closeVideo() {
    modal.classList.remove("is-open");
    modal.querySelector("iframe").src = "";
  }
  document.querySelectorAll(".js-video").forEach(function (el) {
    el.addEventListener("click", function () {
      var src = el.getAttribute("data-video");
      if (src) openVideo(src);
    });
  });

  /* ---------- Date & Time field: text until focused, then native picker ---------- */
  document.querySelectorAll(".field--datetime").forEach(function (input) {
    input.addEventListener("focus", function () { input.type = "datetime-local"; });
    input.addEventListener("blur", function () { if (!input.value) input.type = "text"; });
  });

  /* ---------- Forms (front-end validation only) ----------
     Hook up your backend (Django view / API) inside the "TODO" below. */
  function validateField(field) {
    var value = field.value.trim();
    var msg = "";
    if (field.required && !value) {
      msg = "This field is required.";
    } else if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      msg = "Enter a valid email address.";
    } else if (field.type === "tel" && value && !/^[0-9+()\-\s]{7,}$/.test(value)) {
      msg = "Enter a valid phone number.";
    }
    var holder = field.closest(".field-wrap") || field;
    var err = holder.parentNode.querySelector('.field-error[data-for="' + field.name + '"]');
    if (msg) {
      field.setAttribute("aria-invalid", "true");
      if (!err) {
        err = document.createElement("p");
        err.className = "field-error";
        err.setAttribute("data-for", field.name);
        holder.insertAdjacentElement("afterend", err);
      }
      err.textContent = msg;
    } else {
      field.removeAttribute("aria-invalid");
      if (err) err.remove();
    }
    return !msg;
  }

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var status = form.querySelector(".form__status");
    var fields = form.querySelectorAll(".field");

    fields.forEach(function (f) {
      f.addEventListener("blur", function () { if (f.value || f.hasAttribute("aria-invalid")) validateField(f); });
      f.addEventListener("input", function () { if (f.hasAttribute("aria-invalid")) validateField(f); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var firstBad = null;
      fields.forEach(function (f) {
        if (!validateField(f)) { ok = false; if (!firstBad) firstBad = f; }
      });
      if (!ok) {
        if (status) { status.textContent = "Please fix the highlighted fields."; status.classList.remove("is-success"); }
        if (firstBad) firstBad.focus();
        return;
      }
      // Send form data to WhatsApp
      var fd = new FormData(form);
      var name = fd.get("name") || "";
      var email = fd.get("email") || "";
      var phone = fd.get("phone") || "";
      var datetime = fd.get("datetime") || "";
      var message = fd.get("message") || "";
      var newsletterEmail = fd.get("newsletter_email") || "";

      if (newsletterEmail) {
        // Newsletter form — just show success
        form.reset();
        if (status) {
          status.textContent = form.getAttribute("data-success") || "Subscribed. Thank you!";
          status.classList.add("is-success");
        }
        return;
      }

      var waText = "Hello Aarogya Physiotherapy!%0A%0A";
      if (name) waText += "Name: " + encodeURIComponent(name) + "%0A";
      if (email) waText += "Email: " + encodeURIComponent(email) + "%0A";
      if (phone) waText += "Phone: " + encodeURIComponent(phone) + "%0A";
      if (datetime) waText += "Preferred Time: " + encodeURIComponent(datetime) + "%0A";
      if (message) waText += "Message: " + encodeURIComponent(message) + "%0A";

      var waUrl = "https://wa.me/917800826015?text=" + waText;
      window.open(waUrl, "_blank");

      form.reset();
      if (status) {
        status.textContent = form.getAttribute("data-success") || "Thanks! Redirecting to WhatsApp...";
        status.classList.add("is-success");
      }
    });
  });

  /* ---------- Hero Slider ---------- */
  var heroSlider = document.querySelector(".hero-slider");
  if (heroSlider) {
    var slides = heroSlider.querySelectorAll(".hero-slide");
    var current = 0;
    var total = slides.length;
    var timer = null;

    function goToSlide(index) {
      if (index < 0) index = total - 1;
      if (index >= total) index = 0;
      current = index;
      slides.forEach(function (s, i) {
        s.classList.toggle("is-active", i === current);
      });
    }

    function nextSlide() { goToSlide(current + 1); }

    function startAuto() {
      stopAuto();
      timer = setInterval(nextSlide, 5000);
    }
    function stopAuto() {
      if (timer) clearInterval(timer);
    }

    var heroSection = document.querySelector(".hero--slider");
    if (heroSection) {
      heroSection.addEventListener("mouseenter", stopAuto);
      heroSection.addEventListener("mouseleave", startAuto);
    }

    startAuto();
  }

  /* ---------- FAQ Page Filter & Search ---------- */
  var faqSearch = document.getElementById("faqSearchInput");
  var faqCatBtns = document.querySelectorAll(".faq-cat-btn");
  var allFaqItems = document.querySelectorAll(".faq-item[data-cat]");

  function filterFaqs() {
    var q = faqSearch ? faqSearch.value.toLowerCase().trim() : "";
    var activeCatBtn = document.querySelector(".faq-cat-btn.is-active");
    var cat = activeCatBtn ? activeCatBtn.getAttribute("data-cat") : "all";

    allFaqItems.forEach(function (item) {
      var itemCat = item.getAttribute("data-cat") || "";
      var text = item.textContent.toLowerCase();
      var matchesCat = cat === "all" || itemCat === cat;
      var matchesQuery = !q || text.indexOf(q) > -1;
      item.style.display = (matchesCat && matchesQuery) ? "" : "none";
    });
  }

  if (faqSearch) {
    faqSearch.addEventListener("input", filterFaqs);
  }
  faqCatBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      faqCatBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      filterFaqs();
    });
  });

  /* ---------- Blog Category Filter ---------- */
  var blogCatBtns = document.querySelectorAll(".blog-category-btn");
  var allBlogCards = document.querySelectorAll(".blog-card[data-cat]");
  if (blogCatBtns.length && allBlogCards.length) {
    blogCatBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        blogCatBtns.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        var selected = btn.getAttribute("data-cat");
        allBlogCards.forEach(function (card) {
          var cardCat = card.getAttribute("data-cat");
          card.style.display = (selected === "all" || cardCat === selected) ? "" : "none";
        });
      });
    });
  }
})();
