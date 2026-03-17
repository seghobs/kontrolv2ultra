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
    select.innerHTML = '<option value="">Gruplar yükleniyor...</option>';
    
    fetch("/api/get_groups")
        .then(r => r.json())
        .then(data => {
            if (!data.ok) {
                select.innerHTML = '<option value="">Grup bulunamadı</option>';
                showTokenErrorModal(data.error || "Gruplar yüklenemedi");
                return;
            }
            
            if (data.groups && data.groups.length > 0) {
                let html = '<option value="">-- Instagram Grubu Seç --</option>';
                data.groups.forEach(g => {
                    html += `<option value="${g.id}">${g.name} (${g.member_count} üye)</option>`;
                });
                select.innerHTML = html;
            } else {
                select.innerHTML = '<option value="">Grup bulunamadı</option>';
            }
        })
        .catch(err => {
            select.innerHTML = '<option value="">Hata oluştu</option>';
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
    
    if (!threadId) return;
    
    postSelect.innerHTML = '<option value="">Paylaşımlar yükleniyor...</option>';
    
    fetch("/api/get_group_posts/" + threadId + "?date=" + dateFilter)
        .then(r => r.json())
        .then(data => {
            if (!data.ok) {
                postSelect.innerHTML = '<option value="">Paylaşım bulunamadı</option>';
                return;
            }
            
            if (data.posts && data.posts.length > 0) {
                let html = '<option value="">-- Paylaşım Seç --</option>';
                data.posts.forEach(p => {
                    const icon = p.media_type === 'video' ? '🎬' : '📷';
                    html += `<option value="${p.url}" data-sender="${p.username || ''}">${icon} ${p.username} - ${p.date}</option>`;
                });
                postSelect.innerHTML = html;
            } else {
                postSelect.innerHTML = '<option value="">Bu tarihte paylaşım yok</option>';
            }
        })
        .catch(err => {
            postSelect.innerHTML = '<option value="">Hata oluştu</option>';
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
});
