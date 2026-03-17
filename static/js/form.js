function showTokenErrorModal(message) {
    const modal = document.getElementById("tokenErrorModal");
    document.getElementById("tokenErrorText").textContent = message;
    modal.classList.add("show");
}

function updateUserCount() {
    const textarea = document.getElementById("grup_uye");
    const userCountDisplay = document.getElementById("user_count");
    const users = textarea.value.split("\n").filter((user) => user.trim() !== "");
    userCountDisplay.textContent = users.length + " Adet kullanici eklendi.";
}

window.updateUserCount = updateUserCount;

function loadGroups() {
    const select = document.getElementById("groupSelect");
    const dropdownText = document.querySelector('#groupDropdown .dropdown-text');
    const dropdownOptions = document.querySelector('#groupDropdown .dropdown-options');
    
    dropdownOptions.innerHTML = '<div class="dropdown-option" style="color: rgba(255,255,255,0.5);">Gruplar yükleniyor...</div>';
    
    fetch("/api/get_groups")
        .then(r => r.json())
        .then(data => {
            if (!data.ok) {
                dropdownOptions.innerHTML = '<div class="dropdown-option" style="color: rgba(255,255,255,0.5);">Grup bulunamadı</div>';
                showTokenErrorModal(data.error || "Gruplar yüklenemedi");
                return;
            }
            
            if (data.groups && data.groups.length > 0) {
                dropdownOptions.innerHTML = '';
                data.groups.forEach(g => {
                    const div = document.createElement('div');
                    div.className = 'dropdown-option';
                    div.innerHTML = `<i class="fas fa-users" style="color: #a855f7;"></i> ${g.name} <span style="opacity: 0.6;">(${g.member_count} üye)</span>`;
                    div.onclick = function() {
                        const textSpan = document.querySelector('#groupDropdown .dropdown-text');
                        textSpan.textContent = `${g.name} (${g.member_count} üye)`;
                        select.value = g.id;
                        select.dispatchEvent(new Event('change'));
                        
                        // Close dropdown
                        document.querySelector('#groupDropdown .dropdown-menu').classList.remove('show');
                        document.querySelector('#groupDropdown .dropdown-trigger').classList.remove('active');
                    };
                    dropdownOptions.appendChild(div);
                });
            } else {
                dropdownOptions.innerHTML = '<div class="dropdown-option" style="color: rgba(255,255,255,0.5);">Grup bulunamadı</div>';
            }
        })
        .catch(err => {
            dropdownOptions.innerHTML = '<div class="dropdown-option" style="color: rgba(255,255,255,0.5);">Hata oluştu</div>';
            showTokenErrorModal("Gruplar yüklenemedi: " + err.message);
        });
}

function loadGroupMembers() {
    const select = document.getElementById("groupSelect");
    const threadId = select.value;
    const textarea = document.getElementById("grup_uye");
    const postsSection = document.getElementById("groupPostsSection");
    const postSelect = document.getElementById("postSelect");
    
    if (!threadId) {
        postsSection.style.display = "none";
        return;
    }
    
    select.disabled = true;
    select.options[select.selectedIndex].text = "Üyeler yükleniyor...";
    
    fetch("/api/get_group_members/" + threadId)
        .then(r => r.json())
        .then(data => {
            select.disabled = false;
            
            if (!data.ok) {
                showTokenErrorModal(data.error || "Üyeler yüklenemedi");
                return;
            }
            
            if (data.usernames && data.usernames.length > 0) {
                textarea.value = data.usernames.join("\n");
                updateUserCount();
            }
        })
        .catch(err => {
            select.disabled = false;
            showTokenErrorModal("Üyeler yüklenemedi: " + err.message);
        });
    
    // Paylaşımları yükle
    postsSection.style.display = "block";
    loadGroupPosts();
}

function addPostLink() {
    const postSelect = document.getElementById("postSelect");
    const link = postSelect.value;
    const linkInput = document.getElementById("post_link_single");
    
    if (link) {
        linkInput.value = link;
    }
}

function addAllPosts() {
    const postSelect = document.getElementById("postSelect");
    const multiInput = document.getElementById("post_link_multi");
    const checkForm = document.getElementById("checkForm");
    
    // Önce eski post_sender inputlarını temizle
    const oldInputs = checkForm.querySelectorAll('.post-sender-input');
    oldInputs.forEach(input => input.remove());
    
    const options = postSelect.querySelectorAll("option");
    const urls = [];
    
    options.forEach(opt => {
        if (opt.value && opt.value.startsWith("http")) {
            urls.push(opt.value);
            // Her post için göndericiyi hidden input olarak ekle
            const sender = opt.dataset.sender || '';
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'post_senders';
            input.className = 'post-sender-input';
            input.value = opt.value + '|' + sender;
            checkForm.appendChild(input);
        }
    });
    
    if (urls.length === 0) {
        return;
    }
    
    const currentValue = multiInput.value.trim();
    let newValue = urls.join("\n");
    
    if (currentValue) {
        newValue = currentValue + "\n" + newValue;
    }
    
    multiInput.value = newValue;
    
    const singleInput = document.getElementById("post_link_single");
    const multiSection = document.getElementById("multiLinkSection");
    if (singleInput && multiSection) {
        singleInput.value = "";
        singleInput.style.display = "none";
        multiSection.style.display = "block";
    }
    
    setCheckMode("multi");
}

function loadGroupPosts() {
    const groupSelect = document.getElementById("groupSelect");
    const threadId = groupSelect.value;
    const dateFilter = document.getElementById("dateFilter").value;
    const postSelect = document.getElementById("postSelect");
    const dropdownText = document.querySelector('#postDropdown .dropdown-text');
    const dropdownOptions = document.querySelector('#postDropdown .dropdown-options');
    
    if (!threadId) return;
    
    dropdownOptions.innerHTML = '<div class="dropdown-option" style="color: rgba(255,255,255,0.5);">Paylaşımlar yükleniyor...</div>';
    
    fetch("/api/get_group_posts/" + threadId + "?date=" + dateFilter)
        .then(r => r.json())
        .then(data => {
            if (!data.ok) {
                dropdownOptions.innerHTML = '<div class="dropdown-option" style="color: rgba(255,255,255,0.5);">Paylaşım bulunamadı</div>';
                return;
            }
            
            // Also populate hidden select for addAllPosts
            postSelect.innerHTML = '';
            
            if (data.posts && data.posts.length > 0) {
                dropdownOptions.innerHTML = '';
                data.posts.forEach(p => {
                    const icon = p.media_type === 'video' ? '🎬' : '📷';
                    
                    // Add to hidden select
                    const opt = document.createElement('option');
                    opt.value = p.url;
                    opt.dataset.sender = p.username || '';
                    opt.text = `${icon} ${p.username} - ${p.date}`;
                    postSelect.appendChild(opt);
                    
                    // Add to custom dropdown
                    const div = document.createElement('div');
                    div.className = 'dropdown-option';
                    div.innerHTML = `<span class="icon">${icon}</span> <span>${p.username}</span> <span style="opacity: 0.6; font-size: 11px;">${p.date}</span>`;
                    div.onclick = function() {
                        dropdownText.textContent = `${icon} ${p.username} - ${p.date}`;
                        postSelect.value = p.url;
                        postSelect.dispatchEvent(new Event('change'));
                        
                        // Close dropdown
                        document.querySelector('#postDropdown .dropdown-menu').classList.remove('show');
                        document.querySelector('#postDropdown .dropdown-trigger').classList.remove('active');
                    };
                    dropdownOptions.appendChild(div);
                });
            } else {
                dropdownOptions.innerHTML = '<div class="dropdown-option" style="color: rgba(255,255,255,0.5);">Bu tarihte paylaşım yok</div>';
            }
        })
        .catch(err => {
            dropdownOptions.innerHTML = '<div class="dropdown-option" style="color: rgba(255,255,255,0.5);">Hata oluştu</div>';
        });
}

window.addPostLink = addPostLink;
window.loadGroupPosts = loadGroupPosts;
window.addAllPosts = addAllPosts;

window.loadGroups = loadGroups;
window.loadGroupMembers = loadGroupMembers;
window.addPostLink = addPostLink;

function setCheckMode(mode) {
    window._checkMode = mode === "multi" ? "multi" : "single";

    const singleBtn = document.getElementById("modeSingle");
    const multiBtn = document.getElementById("modeMulti");
    const hint = document.getElementById("modeHint");
    const singleInput = document.getElementById("post_link_single");
    const multiTextarea = document.getElementById("post_link_multi");
    if (!singleBtn || !multiBtn || !hint || !singleInput || !multiTextarea) return;

    if (mode === "multi") {
        singleBtn.classList.remove("active");
        multiBtn.classList.add("active");
        hint.textContent = "Toplu kontrol: Her satira bir post/reel linki yazabilirsiniz.";
        singleInput.style.display = "none";
        singleInput.disabled = true;
        multiTextarea.style.display = "block";
        multiTextarea.disabled = false;
        multiTextarea.rows = 4;
        if (!multiTextarea.value.includes("\n")) {
            multiTextarea.placeholder = "Her satira bir post/reel linki yazin\nhttps://www.instagram.com/p/...\nhttps://www.instagram.com/reel/...";
        }
    } else {
        multiBtn.classList.remove("active");
        singleBtn.classList.add("active");
        hint.textContent = "Tekli kontrol: Tek bir post/reel linki gir.";
        multiTextarea.style.display = "none";
        multiTextarea.disabled = true;
        singleInput.style.display = "block";
        singleInput.disabled = false;
        singleInput.placeholder = "https://www.instagram.com/p/...";
    }
}

function showProgress(show) {
    const overlay = document.getElementById("progressOverlay");
    if (!overlay) return;
    overlay.style.display = show ? "flex" : "none";
    overlay.classList.toggle("show", show);
}

function setProgressText(text, percent) {
    const el = document.getElementById("progressText");
    const bar = document.getElementById("progressBar");
    if (el) el.textContent = text;
    if (bar) {
        bar.style.width = (percent || 0) + "%";
        bar.setAttribute("aria-valuenow", percent || 0);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const tokenErrorMessage = document.body.dataset.tokenErrorMessage;

    document.getElementById("closeTokenModalBtn").addEventListener("click", () => {
        document.getElementById("tokenErrorModal").classList.remove("show");
    });

    document.getElementById("tokenErrorModal").addEventListener("click", (event) => {
        if (event.target.id === "tokenErrorModal") {
            event.currentTarget.classList.remove("show");
        }
    });

    if (tokenErrorMessage) {
        showTokenErrorModal(tokenErrorMessage);
    }

    // Varsayilan olarak tekli kontrol modu
    setCheckMode("single");

    // Gruplari otomatik yükle
    loadGroups();

    const form = document.getElementById("checkForm");
    const submitBtn = document.getElementById("submitCheckBtn");
    if (form && submitBtn) {
        form.addEventListener("submit", (e) => {
            const singleInput = document.getElementById("post_link_single");
            const multiInput = document.getElementById("post_link_multi");
            
            if (!singleInput.value.trim() && !multiInput.value.trim()) {
                e.preventDefault();
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-search me-2"></i>Kontrol Et';
                alert("Lütfen en az bir post linki girin.");
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Kontrol Ediliyor...';
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                const menu = dropdown.querySelector('.dropdown-menu');
                const trigger = dropdown.querySelector('.dropdown-trigger');
                if (menu && menu.classList.contains('show')) {
                    menu.classList.remove('show');
                    trigger.classList.remove('active');
                }
            }
        });
    });
});

// Custom dropdown functions
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const menu = dropdown.querySelector('.dropdown-menu');
    const trigger = dropdown.querySelector('.dropdown-trigger');
    
    // Close other dropdowns
    document.querySelectorAll('.custom-dropdown').forEach(d => {
        if (d.id !== dropdownId) {
            const m = d.querySelector('.dropdown-menu');
            const t = d.querySelector('.dropdown-trigger');
            if (m && m.classList.contains('show')) {
                m.classList.remove('show');
                t.classList.remove('active');
            }
        }
    });
    
    menu.classList.toggle('show');
    trigger.classList.toggle('active');
}

function selectDropdownOption(dropdownId, value, text) {
    const dropdown = document.getElementById(dropdownId);
    const menu = dropdown.querySelector('.dropdown-menu');
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const textSpan = trigger.querySelector('.dropdown-text');
    const hiddenSelect = dropdown.parentElement.querySelector('.hidden-select');
    
    textSpan.textContent = text;
    menu.classList.remove('show');
    trigger.classList.remove('active');
    
    if (hiddenSelect) {
        hiddenSelect.value = value;
        hiddenSelect.dispatchEvent(new Event('change'));
    }
    
    // Update selected state
    dropdown.querySelectorAll('.dropdown-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

function filterDropdown(dropdownId, searchTerm) {
    const dropdown = document.getElementById(dropdownId);
    const options = dropdown.querySelectorAll('.dropdown-option');
    searchTerm = searchTerm.toLowerCase();
    
    options.forEach(opt => {
        const text = opt.textContent.toLowerCase();
        opt.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
}

function updateDropdownOptions(dropdownId, options, onSelect) {
    const dropdown = document.getElementById(dropdownId);
    const optionsContainer = dropdown.querySelector('.dropdown-options');
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const textSpan = trigger.querySelector('.dropdown-text');
    
    optionsContainer.innerHTML = '';
    
    if (options.length === 0) {
        optionsContainer.innerHTML = '<div class="dropdown-option" style="color: rgba(255,255,255,0.5); cursor: default;">Seçenek yok</div>';
        return;
    }
    
    options.forEach((opt, index) => {
        const div = document.createElement('div');
        div.className = 'dropdown-option';
        div.innerHTML = opt.label || opt.text || opt;
        div.onclick = function() {
            const value = opt.value !== undefined ? opt.value : (opt.link || opt);
            const text = opt.label || opt.text || opt;
            textSpan.textContent = text;
            
            // Update hidden select
            const hiddenSelect = dropdown.closest('.mb-2').querySelector('.hidden-select');
            if (hiddenSelect) {
                hiddenSelect.value = value;
                hiddenSelect.dispatchEvent(new Event('change'));
            }
            
            // Close dropdown
            const menu = dropdown.querySelector('.dropdown-menu');
            menu.classList.remove('show');
            trigger.classList.remove('active');
            
            // Run callback
            if (onSelect) onSelect(value);
        };
        optionsContainer.appendChild(div);
    });
}

window.toggleDropdown = toggleDropdown;
window.selectDropdownOption = selectDropdownOption;
window.filterDropdown = filterDropdown;
window.updateDropdownOptions = updateDropdownOptions;
