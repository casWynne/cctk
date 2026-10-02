// app.js
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // =====================================================================
  // CONFIG
  // =====================================================================

  const CONFIG = {
    // Toolbar always visible now (because it always has Saved)
    showSearch: true,               // show/hide search input (toolbar)
    showKeywordFilter: false,        // show/hide dropdown (toolbar)
    showKeywordLegend: true,        // show/hide legend box (above toolbar)
    enableLegendChipFilter: true,   // clicking legend chips applies filters

    interestFormUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=uiBM36hkUkOz-UeIGrvAmrupGAtLuGFKmf4kP4n8GhVUMDhPOVk5SVcyVVBNNEpRU1VJTVJFNjA3VC4u",

    // Super keywords
    useSuperKeywords: true,
    superKeywords: {
      "Cognitive Processes & Learning Mechanisms": [
        "AI Use",
        "Cognitive Appraisal",
        "Expectancy Effects",
        "Implicit Learning",
        "Impression Formation",
        "Interpersonal Expectancies",
        "Learning",
        "Memory",
        "Moral Judgement",
        "Performance Expectancies",
        "Self-Regulation",
        "Sequences",
        "Serial Dependence",
        "Statistical Learning",
        "Decision Making",
        "False Memories",
        "Eyewitness Memory"
      ],

      "Education, Development & Learning Contexts": [
        "Children",
        "Young People",
        "SEND Systems",
        "Special Educational Needs",
        "Online Learning",
        "Remote Learning",
        "Education",
        "Blended Learning",
        "Student Engagement",
        "Student Experience",
        "Student Success",
        "Widening Participation",
        "Transitions",
        "Role Transition",
        "Academic Self-Efficacy",
        "Student Mental Health",
        "Student Wellbeing"
      ],

      "Neurodevelopment & Communication": [
        "Autism",
        "Language Disorders",
        "Stuttering",
        "Visual Disorders"
      ],

      "Mental Health, Wellbeing & Health Psychology": [
        "Anxiety",
        "Depression",
        "Stress",
        "Stress Appraisal",
        "Chronic Stress",
        "Chronic Stressors",
        "Chronic Illness",
        "Chronic Pain",
        "Tinnitus",
        "Pain Tolerance",
        "Bereavement",
        "Mental Health",
        "Mental health of at-risk populations",
        "Health",
        "Health Behaviour",
        "Health Psychology",
        "Wellbeing",
        "Well-being",
        "Hope & Wellbeing",
        "Human Flourishing",
        "Well-being Literacy",
        "Balance and Harmony",
        "Resilience",
        "Compassion",
        "Coping Strategies",
        "Catastrophization",
        "Happiness",
        "Support Networks",
        "Self-Compassion",
        "Positive Psychology",
        "Loneliness",
        "Neuroticism",
        "Forgiveness",
        "Mindfulness"
      ],

      "Identity, Culture & Social Inequality": [
        "Agriculturation & Adjustment",
        "Cross-cultural and international psychology",
        "Cultural intelligence",
        "Culture",
        "Intersectionality",
        "Masculinities",
        "Microaggressions",
        "Migration & Identity",
        "Race/Ethnicity",
        "Racism",
        "Social Identity",
        "Weight Stigma",
        "Body Image",
        "Personality",
        "Personality Traits",
        "Social Desirability",
        "Social Norms",
        "Identity",
        "LGBTQIA+",
        "Gender Identity",
        "Religious Identity",
        "Lived Experience"
      ],

      "Social Processes & Behaviour Change": [
        "Connectedness",
        "Social Cognition",
        "Social Cognitive Theories",
        "Inter-Role Conflict",
        "Impression Management",
        "Behaviour Change",
        "Motivation",
        "Workplace Interactions",
        "Rapport Building"
      ],

      "Risk, Harm & Forensic Behaviour": [
        "Antisocial Traits",
        "Criminal Attitudes",
        "Offence Types",
        "Offtending attitudes",
        "Police Interviewing",
        "Forensic Psychology",
        "Gambling",
        "Responsible Gambling"
      ],

      "Media, Digital & Consumer Psychology": [
        "Advertising",
        "Branding",
        "Digital Cultures",
        "Articificial Intelligence",
        "Social Media Use",
        "Cyberpsychology",
        "Digital Interventions",
        "Retail",
        "Cryptocurrency"
      ],

      "Environment & Sustainability Psychology": [
        "Enivronmental Behaviour",
        "Human Environment Relationships",
        "Environment"
      ],

      "Creativity & Research Approaches": [
        "Creativity",
        "Arts-based research"
      ]
    }
  };

  // =====================================================================
  // STORAGE KEYS
  // =====================================================================

  const STORAGE = {
    topics: "projectSuperSavedTopics",
    staff: "projectSuperSavedStaff",
    excluded: "projectSuperExcludedTopics",
  };

  // =====================================================================
  // STATE (single source of truth)
  // =====================================================================

  const state = {
    currentView: "staff", // "staff" | "projects"
    showSavedOnly: false,

    search: "",
    keyword: "",       // plain keyword OR orphan keyword in super-keyword mode
    superKeyword: "",  // selected theme label in super-keyword mode

    allStaff: [],
    allProjects: [],

    manualTopicIds: new Set(),
    manualStaffIds: new Set(),
    excludedTopicIds: new Set(),

    effectiveTopicIds: new Set(),
    effectiveStaffIds: new Set(),

    currentDisplayed: [],
  };

  // =====================================================================
  // DOM + LIFECYCLE FLAGS
  // =====================================================================

  let dom = {};
  let listenersAttached = false;
  let prePrint = null; // print restore buffer

  // =====================================================================
  // INIT
  // =====================================================================

  bindDom();
  applyConfigVisibility();
  ensureLegendClearButton();
  updateLegendClearButtonVisibility();
  hydrateFromStorage();

  fetch("data/staff-projects.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load staff-projects.json");
      return res.json();
    })
    .then((data) => {
      state.allStaff = (data.staff || []).sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
      );
      state.allProjects = buildProjectProfilesFromStaff(state.allStaff);

      recomputeEffectiveSaves();
      attachListeners();

      refreshKeywordsForCurrentView();
      renderAndUpdate();
    })
    .catch((err) => {
      console.error(err);
      if (dom.profilesList) {
        dom.profilesList.innerHTML =
          '<div class="error-message">Sorry, the project list could not be loaded.</div>';
      }
    });

  // =====================================================================
  // DOM BINDING
  // =====================================================================

  function bindDom() {
    dom = {
      profilesList: document.getElementById("profilesList"),

      // Filters
      searchInput: document.getElementById("searchInput"),
      keywordSelect: document.getElementById("keywordSelect"),
      searchWrapper: document.querySelector(".search-wrapper"),
      keywordWrapper: document.querySelector(".keyword-wrapper"),
      clearSearchBtn: document.getElementById("clearSearchBtn"),
      clearKeywordBtn: document.getElementById("clearKeywordBtn"),

      // Keyword legend
      keywordLegendSection: document.querySelector(".keywords"),
      keywordList: document.getElementById("keywordList"),
      keywordLegendLabel: document.getElementById("keywordLegendLabel"),
      keywordFilterLabel: document.getElementById("keywordFilterLabel"),

      // View toggle
      viewStaffBtn: document.getElementById("viewStaffBtn"),
      viewProjectsBtn: document.getElementById("viewProjectsBtn"),

      // Wrapper sections for visibility control
      search: document.getElementById("search"),
      keyword: document.getElementById("keyword"),

      // Export / saved
      printBtn: document.getElementById("printBtn"),
      savedToggleBtn: document.getElementById("savedToggleBtn"),
      savedCountEl: document.getElementById("savedCount"),
      savedWrapper: document.getElementById("savedWrapper"),
      clearSavedBtn: document.getElementById("clearSavedBtn"),
    };
  }

  // =====================================================================
  // CONFIG VISIBILITY / GUARDRAILS
  // =====================================================================

  function applyConfigVisibility() {
    // Search
    if (dom.search) dom.search.style.display = CONFIG.showSearch ? "" : "none";
    if (dom.searchInput) {
      dom.searchInput.disabled = !CONFIG.showSearch;
      if (!CONFIG.showSearch) {
        dom.searchInput.value = "";
        state.search = "";
      }
    }

    // Keyword dropdown
    if (dom.keyword) dom.keyword.style.display = CONFIG.showKeywordFilter ? "" : "none";
    if (dom.keywordSelect) {
      dom.keywordSelect.disabled = !CONFIG.showKeywordFilter;

      if (!CONFIG.showKeywordFilter) {
        const chipsCanFilter = CONFIG.showKeywordLegend && CONFIG.enableLegendChipFilter;

        // Reset visible dropdown value regardless
        dom.keywordSelect.value = "";

        // If user has no way to control keyword filtering, clear it
        if (!chipsCanFilter) {
          state.keyword = "";
          state.superKeyword = "";
        }
      }
    }

    // Keyword legend
    if (dom.keywordLegendSection) {
      dom.keywordLegendSection.style.display = CONFIG.showKeywordLegend ? "" : "none";
    }

    // If BOTH controls are hidden, ensure no invisible filtering
    if (!CONFIG.showKeywordLegend && !CONFIG.showKeywordFilter) {
      state.keyword = "";
      state.superKeyword = "";
      if (dom.keywordSelect) dom.keywordSelect.value = "";
    }
  }

  function hasActiveKeywordFilter() {
    return !!(String(state.superKeyword || "").trim() || String(state.keyword || "").trim());
  }

  function ensureLegendClearButton() {
    if (!dom.keywordLegendSection) return;
    if (dom.keywordLegendSection.querySelector(".legend-clear-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "legend-clear-btn";
    btn.textContent = "Clear ✕";
    btn.setAttribute("aria-label", "Clear keyword/theme filter");

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      state.keyword = "";
      state.superKeyword = "";

      if (dom.keywordSelect) dom.keywordSelect.value = "";
      renderAndUpdate();
    });

    dom.keywordLegendSection.appendChild(btn);
  }

  function updateLegendClearButtonVisibility() {
    const btn = dom.keywordLegendSection?.querySelector(".legend-clear-btn");
    if (!btn) return;

    const shouldShow =
      CONFIG.showKeywordLegend &&
      CONFIG.enableLegendChipFilter &&
      hasActiveKeywordFilter();

    btn.style.display = shouldShow ? "inline-flex" : "none";
  }

  // =====================================================================
  // STORAGE
  // =====================================================================

  function hydrateFromStorage() {
    state.manualTopicIds = new Set(loadArray(STORAGE.topics));
    state.manualStaffIds = new Set(loadArray(STORAGE.staff));
    state.excludedTopicIds = new Set(loadArray(STORAGE.excluded));
  }

  function persistToStorage() {
    saveArray(STORAGE.topics, Array.from(state.manualTopicIds));
    saveArray(STORAGE.staff, Array.from(state.manualStaffIds));
    saveArray(STORAGE.excluded, Array.from(state.excludedTopicIds));
  }

  function loadArray(key) {
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveArray(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
  }

  // =====================================================================
  // DATA SHAPING
  // =====================================================================
  function sanitizeLimitedHtml(input = "") {
    const template = document.createElement("template");
    template.innerHTML = input;

    const allowed = new Set(["STRONG", "EM", "BR", "P", "UL", "OL", "LI", "A"]);

    // Remove disallowed elements, strip unsafe attributes
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);

    const toProcess = [];
    while (walker.nextNode()) toProcess.push(walker.currentNode);

    toProcess.forEach((el) => {
      if (!allowed.has(el.tagName)) {
        // Replace element with its text content (keeps readable content)
        el.replaceWith(document.createTextNode(el.textContent || ""));
        return;
      }

      // Strip all attributes except safe href/target/rel on links
      [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));

      if (el.tagName === "A") {
        const href = el.getAttribute("href") || "";
        // Only allow http(s) links
        if (!/^https?:\/\//i.test(href)) {
          el.replaceWith(document.createTextNode(el.textContent || ""));
          return;
        }
        el.setAttribute("href", href);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
    });

    return template.innerHTML;
  }

  function buildProjectProfilesFromStaff(staffList) {
    const projects = [];

    staffList.forEach((staff) => {
      const staffKeywords = staff.keywords || [];
      const staffAvatar = staff.avatar || "";
      const staffAvatarPosition = staff.avatarPosition || "50% 50%";
      const supervisorId = staff.id || staff.name;

      (staff.topics || []).forEach((topic, idx) => {
        projects.push({
          id: `${supervisorId}-topic-${idx + 1}`,
          projectTitle: topic.title || "Untitled project",
          projectDescription: topic.description || "",
          ideas: topic.ideas || [],

          supervisorId,
          supervisorName: staff.name || "Unknown supervisor",
          email: staff.email || "",
          avatar: staffAvatar,
          avatarPosition: staffAvatarPosition,

          keywords: staffKeywords,
        });
      });
    });

    return projects;
  }

  function getActiveList() {
    return state.currentView === "staff" ? state.allStaff : state.allProjects;
  }

  // =====================================================================
  // SAVES (core logic)
  // =====================================================================

  function recomputeEffectiveSaves() {
    // 1) Topics derived from saved staff (minus exclusions)
    const topicsFromStaff = new Set();
    for (const staffId of state.manualStaffIds) {
      for (const p of state.allProjects) {
        if (p.supervisorId === staffId && !state.excludedTopicIds.has(p.id)) {
          topicsFromStaff.add(p.id);
        }
      }
    }

    // 2) Effective topics = manual topics + staff-derived topics
    state.effectiveTopicIds = new Set([...state.manualTopicIds, ...topicsFromStaff]);

    // 3) Effective staff = manual staff + anyone who has at least one effective topic
    state.effectiveStaffIds = new Set(state.manualStaffIds);
    for (const p of state.allProjects) {
      if (state.effectiveTopicIds.has(p.id)) state.effectiveStaffIds.add(p.supervisorId);
    }

    // 4) Auto-clean: if a manual staff has zero effective topics left, unsave that staff + clear its exclusions
    for (const staffId of Array.from(state.manualStaffIds)) {
      const hasAny = state.allProjects.some(
        (p) => p.supervisorId === staffId && state.effectiveTopicIds.has(p.id)
      );
      if (!hasAny) {
        state.manualStaffIds.delete(staffId);
        state.allProjects.forEach((p) => {
          if (p.supervisorId === staffId) state.excludedTopicIds.delete(p.id);
        });
      }
    }
  }

  function isTopicSaved(topicId) {
    return state.effectiveTopicIds.has(topicId);
  }

  function isStaffSaved(staffId) {
    return state.effectiveStaffIds.has(staffId);
  }

  // =====================================================================
  // KEYWORDS / THEMES
  // =====================================================================

  function normaliseKw(s) {
    return String(s || "").trim().toLowerCase();
  }

  function getAllUniqueKeywords(profiles) {
    const all = new Set();
    profiles.forEach((p) => {
      (p.keywords || []).forEach((kw) => {
        if (kw && kw.trim()) all.add(kw.trim());
      });
    });
    return Array.from(all).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  function getSuperKeywordNames() {
    return Object.keys(CONFIG.superKeywords || {}).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }

  function getSuperKeywordMembers(superName) {
    const map = CONFIG.superKeywords || {};
    return (map[superName] || []).map(normaliseKw).filter(Boolean);
  }

  function getAllSuperKeywordMembersSet() {
    const set = new Set();
    Object.values(CONFIG.superKeywords || {}).forEach((arr) => {
      (arr || []).forEach((k) => set.add(normaliseKw(k)));
    });
    return set;
  }

  function getOrphanKeywords(activeList) {
    const all = getAllUniqueKeywords(activeList); // original-cased
    const themed = getAllSuperKeywordMembersSet(); // normalised
    return all.filter((k) => !themed.has(normaliseKw(k)));
  }

  function setKeywordUiLabels() {
    const usingSuper = !!CONFIG.useSuperKeywords;

    if (dom.keywordLegendLabel) dom.keywordLegendLabel.textContent = usingSuper ? "Themes" : "Keywords";
    if (dom.keywordFilterLabel) dom.keywordFilterLabel.textContent = usingSuper ? "Filter by theme" : "Filter by keyword";

    if (dom.keywordSelect) {
      const first = dom.keywordSelect.querySelector("option[value='']");
      if (first) first.textContent = usingSuper ? "All themes" : "All keywords";
    }
  }

  function buildKeywordDropdown(labels) {
    if (!dom.keywordSelect) return;

    const firstLabel = CONFIG.useSuperKeywords ? "All themes" : "All keywords";
    dom.keywordSelect.innerHTML = `<option value="">${firstLabel}</option>`;

    labels.forEach((label) => {
      const opt = document.createElement("option");
      opt.value = label;
      opt.textContent = label;
      dom.keywordSelect.appendChild(opt);
    });
  }

  function renderKeywordLegend(items) {
    if (!dom.keywordList) return;
    dom.keywordList.innerHTML = "";

    items.forEach(({ label, type }) => {
      const chip = document.createElement("button");
      chip.className = "keyword-chip";
      chip.type = "button";
      chip.textContent = label;

      if (type === "super") chip.classList.add("keyword-chip--super");
      if (type === "orphan") chip.classList.add("keyword-chip--orphan");
      if (type === "keyword") chip.classList.add("keyword-chip--keyword");

      // Disabled styling if chip filtering is off
      if (!CONFIG.enableLegendChipFilter) {
        chip.classList.add("is-disabled");
        chip.setAttribute("aria-disabled", "true");
      }

      if (CONFIG.enableLegendChipFilter) {
        chip.addEventListener("click", () => {
          // SUPER MODE:
          // - clicking a super chip sets superKeyword
          // - clicking an orphan chip sets keyword (and clears theme)
          if (CONFIG.useSuperKeywords) {
            if (type === "super") {
              state.superKeyword = label;
              state.keyword = "";
              if (dom.keywordSelect && CONFIG.showKeywordFilter) dom.keywordSelect.value = label;
            } else {
              state.keyword = label;      // orphan keyword
              state.superKeyword = "";
              if (dom.keywordSelect && CONFIG.showKeywordFilter) dom.keywordSelect.value = "";
            }
          } else {
            // PLAIN KEYWORD MODE:
            state.keyword = label;
            state.superKeyword = "";
            if (dom.keywordSelect && CONFIG.showKeywordFilter) dom.keywordSelect.value = label;
          }

          renderAndUpdate();
        });
      }

      dom.keywordList.appendChild(chip);
    });
  }

  function refreshKeywordsForCurrentView() {
    const active = getActiveList();

    let dropdownLabels = [];
    let legendItems = [];

    if (CONFIG.useSuperKeywords) {
      const themes = getSuperKeywordNames();
      const orphans = getOrphanKeywords(active);

      dropdownLabels = themes;
      legendItems = themes.map((label) => ({ label, type: "super" }))
        .concat(orphans.map((label) => ({ label, type: "orphan" })));
    } else {
      const keywords = getAllUniqueKeywords(active);
      dropdownLabels = keywords;
      legendItems = keywords.map((label) => ({ label, type: "keyword" }));
    }

    buildKeywordDropdown(dropdownLabels);
    renderKeywordLegend(legendItems);
    setKeywordUiLabels();
    ensureLegendClearButton();
    updateLegendClearButtonVisibility();
  }

  // =====================================================================
  // FILTERS
  // =====================================================================

  function applyFilters() {
    recomputeEffectiveSaves();

    const term = (state.search || "").trim().toLowerCase();
    const active = getActiveList();

    const chosenKeywordNorm = normaliseKw(state.keyword);         // orphan keyword OR keyword
    const chosenThemeLabel = (state.superKeyword || "").trim();   // keep for lookup
    const chosenThemeNorm = normaliseKw(state.superKeyword);

    const themeMembers = (CONFIG.useSuperKeywords && chosenThemeLabel)
      ? getSuperKeywordMembers(chosenThemeLabel) // normalised
      : [];

    const filtered = active.filter((item) => {
      const itemKeywords = (item.keywords || []).map(normaliseKw).filter(Boolean);
      const keywordText = itemKeywords.join(" ");

      // Search text
      let allText = "";
      if (state.currentView === "staff") {
        const topicsText = (item.topics || [])
          .map((t) => `${t.title || ""} ${t.description || ""} ${(t.ideas || []).join(" ")}`)
          .join(" ");
        allText = `${item.name || ""} ${keywordText} ${topicsText}`.toLowerCase();
      } else {
        allText = `${item.projectTitle || ""} ${item.projectDescription || ""} ${(item.ideas || []).join(" ")} ${item.supervisorName || ""} ${keywordText}`.toLowerCase();
      }

      const matchesSearch = !term || allText.includes(term);

      // Keyword / theme match
      let matchesKeyword = true;

      if (CONFIG.useSuperKeywords) {
        // Theme selected
        if (chosenThemeNorm) {
          // If theme has no members yet, don't hide everything
          matchesKeyword = themeMembers.length === 0
            ? true
            : themeMembers.some((m) => itemKeywords.includes(m));
        }
        // Orphan keyword selected (from legend)
        else if (chosenKeywordNorm) {
          // Keep behaviour consistent with earlier (substring is fine since it's already normalised)
          matchesKeyword = keywordText.includes(chosenKeywordNorm);
        }
      } else {
        // Plain keyword mode
        matchesKeyword = !chosenKeywordNorm || keywordText.includes(chosenKeywordNorm);
      }

      return matchesSearch && matchesKeyword;
    });

    // Saved-only filter
    if (!state.showSavedOnly) return filtered;

    if (state.currentView === "projects") {
      return filtered.filter((x) => state.effectiveTopicIds.has(x.id));
    }
    return filtered.filter((x) => state.effectiveStaffIds.has(x.id));
  }

  // =====================================================================
  // RENDER
  // =====================================================================

  function renderAndUpdate() {
    const list = applyFilters();
    renderProfiles(list);
    syncControlsFromState();
  }


  function renderProfiles(items) {
    recomputeEffectiveSaves();

    state.currentDisplayed = items;
    if (!dom.profilesList) return;
    dom.profilesList.innerHTML = "";

    if (!items.length) {
      dom.profilesList.innerHTML =
        '<div class="empty-message">No profiles match your search or filters.</div>';
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "profile-card";
      card.tabIndex = 0;
      card.setAttribute("aria-expanded", "false");

      const avatarSrc =
        item.avatar && item.avatar.trim() !== "" ? item.avatar : "../../assets/staff/default-avatar.jpg";
      const avatarPosition = item.avatarPosition || "50% 50%";

      const keywordsHtml = (item.keywords || [])
        .map((kw) => `<span class="keyword-chip" aria-label="Keyword: ${escapeHtml(kw)}">${escapeHtml(kw)}</span>`)
        .join("");

      const headerName =
        state.currentView === "staff" ? (item.name || "Unknown staff") : (item.projectTitle || "Untitled topic");

      const saved =
        state.currentView === "projects" ? isTopicSaved(item.id) : isStaffSaved(item.id);

      if (saved) card.classList.add("is-saved");

      let detailsHtml = "";
      let emailForButton = item.email || "";

      if (state.currentView === "staff") {
        const topicsHtml = (item.topics || [])
          .map((topic, i, arr) => {
            const ideas = (topic.ideas || []).map((idea) => `<li>${idea}</li>`).join("");
            return `
              <section class="profile-topic">
                <h3>${i + 1}. ${escapeHtml(topic.title || "")}</h3>
                <p>${sanitizeLimitedHtml(topic.description || "")}</p>
                ${ideas
                ? `<p><strong>Within this topic, you could investigate:</strong></p><ul>${ideas}</ul>`
                : ""
              }
              </section>
              ${i < arr.length - 1 ? "<hr class='topic-divider'>" : ""}
            `;
          })
          .join("");

        detailsHtml = topicsHtml || "<p>No project details have been added yet.</p>";
      } else {
        const ideasList = (item.ideas || []).map((idea) => `<li class="idea-item">${idea}</li>`).join("");
        detailsHtml = `
          <div class="project-details">
            <p><strong>Supervisor:</strong> ${escapeHtml(item.supervisorName || "Unknown")}</p>
            ${item.projectDescription ? `<p class="project-description">${escapeHtml(item.projectDescription)}</p>` : ""}
            ${ideasList
            ? `<p><strong>Within this project, you could investigate:</strong></p><ul class="idea-list">${ideasList}</ul>`
            : ""
          }
          </div>
        `;
      }

      const saveType = state.currentView === "projects" ? "topic" : "staff";
      const saveBtnHtml = `
        <button
          class="detail-btn detail-btn-save"
          type="button"
          data-save-id="${escapeHtml(item.id)}"
          data-save-type="${saveType}"
          aria-pressed="${saved ? "true" : "false"}"
        >
          <span class="detail-btn-icon">${saved ? "⭐" : "☆"}</span>
          ${saved ? "Saved" : "Save"}
        </button>
      `;

      card.innerHTML = `
        <div class="profile-header">
          <div class="profile-avatar">
            <img
              src="${escapeHtml(avatarSrc)}"
              alt="Profile picture"
              style="width:100%;height:100%;object-fit:cover;object-position:${escapeHtml(avatarPosition)};"
              onerror="this.onerror=null; this.src='images/default-avatar.jpg';"
            />
          </div>

          <div class="profile-main">
            <div class="profile-name">${escapeHtml(headerName)}</div>
            <div class="keyword-row">${keywordsHtml}</div>
          </div>
        </div>

        <div class="profile-details">
          ${detailsHtml}

          <div class="profile-detail-footer">
            <button class="detail-btn detail-btn-email" type="button" data-email="${escapeHtml(emailForButton)}">
              <span class="detail-btn-icon">❓</span>
              Questions? Email me
            </button>

            <button class="detail-btn detail-btn-interest" type="button">
              <span class="detail-btn-icon">👍</span>
              Interested in this topic
            </button>

            ${saveBtnHtml}
          </div>
        </div>
      `;

      dom.profilesList.appendChild(card);
    });
  }

  // =====================================================================
  // UI HELPERS
  // =====================================================================
  function syncControlsFromState() {
    recomputeEffectiveSaves();

    // --- Search clear "x"
    if (dom.searchWrapper && dom.searchInput) {
      dom.searchWrapper.classList.toggle("has-value", !!dom.searchInput.value.trim());
    }

    // --- Keyword/theme dropdown clear "x"
    // NOTE: keywordSelect shows themes in super mode, keywords in plain mode
    if (dom.keywordWrapper && dom.keywordSelect) {
      dom.keywordWrapper.classList.toggle("has-value", !!dom.keywordSelect.value.trim());
    }

    // --- Saved count + clear "x" on Saved toggle
    const savedCount =
      state.currentView === "projects" ? state.effectiveTopicIds.size : state.effectiveStaffIds.size;

    if (dom.savedCountEl) dom.savedCountEl.textContent = String(savedCount);
    if (dom.savedWrapper) dom.savedWrapper.classList.toggle("has-value", savedCount > 0);

    // --- Toggle UI (staff/projects) + body class + saved-only button
    if (dom.viewStaffBtn && dom.viewProjectsBtn) {
      const staffActive = state.currentView === "staff";

      dom.viewStaffBtn.classList.toggle("is-active", staffActive);
      dom.viewProjectsBtn.classList.toggle("is-active", !staffActive);

      dom.viewStaffBtn.setAttribute("aria-pressed", staffActive ? "true" : "false");
      dom.viewProjectsBtn.setAttribute("aria-pressed", staffActive ? "false" : "true");

      document.body.classList.toggle("view-projects", !staffActive);
      document.body.classList.toggle("view-staff", staffActive);
    }

    if (dom.savedToggleBtn) {
      dom.savedToggleBtn.classList.toggle("is-active", state.showSavedOnly);
      dom.savedToggleBtn.setAttribute("aria-pressed", state.showSavedOnly ? "true" : "false");
    }

    // --- Legend clear button visibility
    updateLegendClearButtonVisibility();
  }

  function toggleCard(card) {
    const details = card.querySelector(".profile-details");
    if (!details) return;

    const isOpen = card.classList.contains("open");
    card.classList.toggle("open", !isOpen);
    card.setAttribute("aria-expanded", !isOpen ? "true" : "false");
  }

  // =====================================================================
  // EVENTS (attach once)
  // =====================================================================

  function attachListeners() {
    if (listenersAttached) return;
    listenersAttached = true;

    // Search
    if (dom.searchInput) {
      dom.searchInput.addEventListener("input", () => {
        state.search = dom.searchInput.value;
        renderAndUpdate();
      });
    }

    // Keyword dropdown (themes in super mode, keywords in plain mode)
    if (dom.keywordSelect) {
      dom.keywordSelect.addEventListener("change", () => {
        const v = dom.keywordSelect.value;

        if (CONFIG.useSuperKeywords) {
          state.superKeyword = v;
          state.keyword = ""; // dropdown only controls themes
        } else {
          state.keyword = v;
          state.superKeyword = "";
        }

        renderAndUpdate();
      });
    }

    // Clear search
    if (dom.clearSearchBtn && dom.searchInput) {
      dom.clearSearchBtn.addEventListener("click", () => {
        dom.searchInput.value = "";
        state.search = "";
        renderAndUpdate();
        dom.searchInput.focus();
      });
    }

    // Clear keyword/theme
    if (dom.clearKeywordBtn && dom.keywordSelect) {
      dom.clearKeywordBtn.addEventListener("click", () => {
        dom.keywordSelect.value = "";
        state.keyword = "";
        state.superKeyword = "";
        renderAndUpdate();
        dom.keywordSelect.focus();
      });
    }

    // Saved-only toggle
    if (dom.savedToggleBtn) {
      dom.savedToggleBtn.addEventListener("click", () => {
        state.showSavedOnly = !state.showSavedOnly;
        renderAndUpdate();
      });
    }

    // Clear all saved
    if (dom.clearSavedBtn) {
      dom.clearSavedBtn.addEventListener("click", () => {
        state.showSavedOnly = false;
        state.manualStaffIds.clear();
        state.manualTopicIds.clear();
        state.excludedTopicIds.clear();
        persistToStorage();
        renderAndUpdate();
      });
    }

    // View toggles
    if (dom.viewStaffBtn) {
      dom.viewStaffBtn.addEventListener("click", () => {
        state.currentView = "staff";
        refreshKeywordsForCurrentView();
        renderAndUpdate();
      });
    }

    if (dom.viewProjectsBtn) {
      dom.viewProjectsBtn.addEventListener("click", () => {
        state.currentView = "projects";
        refreshKeywordsForCurrentView();
        renderAndUpdate();
      });
    }

    // Print
    if (dom.printBtn) {
      dom.printBtn.addEventListener("click", () => {
        printInPlace(state.currentDisplayed);
      });
    }

    // Delegated clicks (cards + footer buttons + save button)
    if (dom.profilesList) {
      dom.profilesList.addEventListener("click", (event) => {
        const saveBtn = event.target.closest(".detail-btn-save");
        if (saveBtn) {
          event.stopPropagation();
          handleSaveClick(saveBtn);
          return;
        }

        const interestBtn = event.target.closest(".detail-btn-interest");
        if (interestBtn) {
          event.stopPropagation();
          window.open(CONFIG.interestFormUrl, "_blank");
          return;
        }

        const emailBtn = event.target.closest(".detail-btn-email");
        if (emailBtn) {
          event.stopPropagation();
          const email = emailBtn.dataset.email || "";
          if (email) {
            window.location.href =
              `mailto:${email}?subject=I%20am%20interested%20in%20your%20research%20project`;
          }
          return;
        }

        const card = event.target.closest(".profile-card");
        if (!card) return;
        toggleCard(card);
      });

      dom.profilesList.addEventListener("keydown", (event) => {
        const card = event.target.closest(".profile-card");
        if (!card) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleCard(card);
        }
      });
    }
  }

  // =====================================================================
  // SAVE HANDLING
  // =====================================================================

  function handleSaveClick(btn) {
    const id = btn.dataset.saveId;
    const type = btn.dataset.saveType; // "topic" | "staff"
    if (!id || !type) return;

    recomputeEffectiveSaves();

    if (type === "staff") {
      if (state.manualStaffIds.has(id)) {
        // OFF: remove staff + remove manual topic saves for them + clear exclusions
        state.manualStaffIds.delete(id);
        state.allProjects.forEach((p) => {
          if (p.supervisorId === id) {
            state.manualTopicIds.delete(p.id);
            state.excludedTopicIds.delete(p.id);
          }
        });
      } else {
        // ON: save staff + clear exclusions so all topics show
        state.manualStaffIds.add(id);
        state.allProjects.forEach((p) => {
          if (p.supervisorId === id) state.excludedTopicIds.delete(p.id);
        });
      }

      persistToStorage();
      renderAndUpdate();
      return;
    }

    // type === "topic"
    const topicId = id;
    const topic = state.allProjects.find((p) => p.id === topicId);
    const staffId = topic?.supervisorId;

    const isEffective = state.effectiveTopicIds.has(topicId);

    if (isEffective) {
      // OFF
      state.manualTopicIds.delete(topicId);

      // If topic is effective due to staff save, exclude it
      if (staffId && state.manualStaffIds.has(staffId)) {
        state.excludedTopicIds.add(topicId);
      }
    } else {
      // ON
      state.excludedTopicIds.delete(topicId);
      state.manualTopicIds.add(topicId);
    }

    persistToStorage();
    renderAndUpdate();
  }

  // =====================================================================
  // PRINT (in-place swap, then restore + rebind)
  // =====================================================================

  function printInPlace(items) {
    prePrint = {
      title: document.title,
      scrollY: window.scrollY,
      bodyClass: document.body.className,
      bodyHtml: document.body.innerHTML,
      stateSnapshot: {
        currentView: state.currentView,
        showSavedOnly: state.showSavedOnly,
        search: state.search,
        keyword: state.keyword,
        superKeyword: state.superKeyword,
      },
    };

    const dateStr = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const title =
      state.currentView === "staff"
        ? "Research Projects Directory — Staff"
        : "Research Projects Directory — Topics";

    const subtitle =
      state.currentView === "staff"
        ? "Staff profiles and their available dissertation topics"
        : "Dissertation topics (with supervising staff shown)";

    const cards =
      state.currentView === "staff"
        ? buildStaffPrintCards(items)
        : buildTopicPrintCards(items);

    document.title = title;
    document.body.className = "print-mode";
    document.body.innerHTML = `
      <main class="print-wrap">
        <header class="print-header">
          <h1>${escapeHtml(title)}</h1>
          <p class="print-meta">${escapeHtml(subtitle)} • Generated ${escapeHtml(dateStr)} • Showing ${items.length} result(s)</p>
        </header>
        <section class="print-grid">
          ${cards || `<div class="print-card"><p>No results to export (try clearing filters).</p></div>`}
        </section>
      </main>
    `;

    const restoreOnce = once(restoreAfterPrint);

    window.addEventListener("afterprint", restoreOnce, { once: true });
    setTimeout(restoreOnce, 800);

    window.print();
  }

  function restoreAfterPrint() {
    if (!prePrint) return;

    document.body.innerHTML = prePrint.bodyHtml;
    document.body.className = prePrint.bodyClass;
    document.title = prePrint.title;

    bindDom();
    applyConfigVisibility();
    listenersAttached = false;
    attachListeners();

    const snap = prePrint.stateSnapshot;
    state.currentView = snap.currentView;
    state.showSavedOnly = snap.showSavedOnly;
    state.search = snap.search;
    state.keyword = snap.keyword;
    state.superKeyword = snap.superKeyword;

    if (dom.searchInput) dom.searchInput.value = state.search;

    // dropdown value depends on mode (themes vs keywords)
    if (dom.keywordSelect) {
      dom.keywordSelect.value = CONFIG.useSuperKeywords ? state.superKeyword : state.keyword;
    }

    // Enforce config so we don't restore invisible filters
    if (!CONFIG.showSearch) {
      state.search = "";
      if (dom.searchInput) dom.searchInput.value = "";
    }

    if (!CONFIG.showKeywordFilter) {
      const chipsCanFilter = CONFIG.showKeywordLegend && CONFIG.enableLegendChipFilter;
      if (!chipsCanFilter) {
        state.keyword = "";
        state.superKeyword = "";
      }
      if (dom.keywordSelect) dom.keywordSelect.value = "";
    }

    refreshKeywordsForCurrentView();
    renderAndUpdate();

    window.scrollTo(0, prePrint.scrollY);
    prePrint = null;
  }

  function once(fn) {
    let done = false;
    return (...args) => {
      if (done) return;
      done = true;
      fn(...args);
    };
  }

  function buildStaffPrintCards(items) {
    return items
      .map((s) => {
        const keywords = (s.keywords || [])
          .map((kw) => `<span class="print-pill">${escapeHtml(kw)}</span>`)
          .join("");

        const topics = (s.topics || [])
          .map((t, idx) => {
            const ideas = (t.ideas || []).map((i) => `<li>${sanitizeIdeaHtml(i)}</li>`).join("");
            return `
              <div class="print-line"><strong>${idx + 1}. ${escapeHtml(t.title || "")}</strong></div>
              ${t.description ? `<div class="print-line">${escapeHtml(t.description)}</div>` : ""}
              ${ideas ? `<ul>${ideas}</ul>` : ""}
            `;
          })
          .join("<hr style='border:none;border-top:1px solid rgba(0,0,0,0.06); margin:10px 0;' />");

        return `
          <section class="print-card">
            <h2>${escapeHtml(s.name || "Unknown staff")}</h2>
            ${s.email ? `<div class="print-line">${escapeHtml(s.email)}</div>` : ""}
            ${topics || `<div class="print-line">No topic details provided.</div>`}
            ${keywords ? `<div class="print-keywords"><strong>Keywords:</strong> ${keywords}</div>` : ""}
          </section>
        `;
      })
      .join("");
  }

  function buildTopicPrintCards(items) {
    return items
      .map((p) => {
        const keywords = (p.keywords || [])
          .map((kw) => `<span class="print-pill">${escapeHtml(kw)}</span>`)
          .join("");

        const ideas = (p.ideas || []).map((i) => `<li>${sanitizeIdeaHtml(i)}</li>`).join("");

        return `
          <section class="print-card">
            <h2>${escapeHtml(p.projectTitle || "Untitled topic")}</h2>
            <div class="print-line"><strong>Supervisor:</strong> ${escapeHtml(p.supervisorName || "Unknown")}${p.email ? ` • ${escapeHtml(p.email)}` : ""}</div>
            ${p.projectDescription ? `<div class="print-line">${escapeHtml(p.projectDescription)}</div>` : ""}
            ${ideas ? `<ul>${ideas}</ul>` : ""}
            ${keywords ? `<div class="print-keywords"><strong>Keywords:</strong> ${keywords}</div>` : ""}
          </section>
        `;
      })
      .join("");
  }

  // =====================================================================
  // UTILS
  // =====================================================================

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function sanitizeIdeaHtml(idea) {
    const raw = String(idea ?? "");
    if (!raw.includes("<")) return escapeHtml(raw);

    const escaped = raw
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    return escaped.replace(
      /&lt;a\s+href=(&quot;|&#039;)(.*?)\1\s*(target=(&quot;|&#039;).*?\4)?\s*&gt;(.*?)&lt;\/a&gt;/gi,
      (_m, _q, href, _t, _tq, text) => {
        const safeHref = String(href).startsWith("http") ? href : "#";
        return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
    );
  }
});
