/* 홈 화면 추가 버튼 (2026-10-13)
   - 크롬이 자동으로 띄우는 설치 팝업(아래쪽 배너)은 막는다
   - 대신 오른쪽 아래에 이 앱 아이콘 + 작은 설명을 보여준다
     (그리스신화 페이지는 #hs-slot 자리 = 오른쪽 위. 아이폰은 누르면 '공유 → 홈 화면에 추가' 안내)
   - 설치할 수 있을 때만 보이고, 이미 설치했거나 앱으로 열었으면 안 보인다 */
(function () {
  var saved = null;
  // 앱으로 설치해서 열었을 때: 갤럭시탭 아래 작업표시줄이 화면 아래를 덮으므로
  // 페이지 아래에 여백을 줘서 버튼이 작업표시줄 위로 올라오게 한다
  var st = document.createElement('style');
  st.textContent = '@media (display-mode: standalone){' +
    'body{box-sizing:border-box;padding-bottom:calc(84px + env(safe-area-inset-bottom)) !important}}';
  (document.head || document.documentElement).appendChild(st);
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    // 화면 아래에 붙어 떠 있는 버튼(사용법 등)도 작업표시줄 위로 올리기
    var lift = function () {
      var all = document.body.getElementsByTagName('*');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (el.dataset.hsLifted) continue;
        var cs = getComputedStyle(el);
        if (cs.position !== 'fixed') continue;
        var r = el.getBoundingClientRect();
        if (!r.height || r.height > window.innerHeight * 0.5) continue;   // 전체 화면 덮개는 그대로
        if (window.innerHeight - r.bottom > 40) continue;                  // 아래에 붙은 것만
        el.style.bottom = 'calc(' + cs.bottom + ' + 84px)';
        el.dataset.hsLifted = '1';
      }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lift); else lift();
    window.addEventListener('load', lift);
    setTimeout(lift, 1000);
    return;
  }

  // 아이폰·아이패드(사파리·크롬 모두)는 설치 팝업이 없어서, 버튼을 누르면 '공유 → 홈 화면에 추가' 안내를 띄운다
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS && !navigator.standalone) show();

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();            // 자동 팝업 막기
    saved = e;
    show();
  });
  window.addEventListener('appinstalled', hide);

  var box;
  function show() {
    if (box || !document.body) { if (!document.body) document.addEventListener('DOMContentLoaded', show); return; }
    var css = document.createElement('style');
    css.textContent =
      '#hs-add{position:fixed;right:12px;bottom:12px;z-index:9999;display:flex;flex-direction:column;align-items:center;' +
      'gap:3px;background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;font-family:inherit}' +
      '#hs-add img{width:48px;height:48px;border-radius:14px;box-shadow:0 3px 10px rgba(0,0,0,.18)}' +
      '#hs-add span{font-size:10.5px;line-height:1.25;color:#7a6a80;background:rgba(255,255,255,.88);' +
      'padding:2px 6px;border-radius:8px;text-align:center;white-space:nowrap}';
    document.head.appendChild(css);
    box = document.createElement('button');
    box.id = 'hs-add';
    box.type = 'button';
    box.setAttribute('aria-label', '홈 화면에 추가');
    box.innerHTML = '<img src="icon-192.png" alt=""><span>홈 화면에 추가<br>앱처럼 열려요</span>';
    box.onclick = function () {
      if (!saved) { if (isIOS) iosGuide(); return; }
      saved.prompt();
      saved.userChoice.then(function (r) { if (r.outcome === 'accepted') hide(); saved = null; });
    };
    var slot = document.getElementById('hs-slot');
    if (slot) {                    // 페이지가 자리를 정해 두었으면 거기에 (떠다니지 않음)
      box.style.position = 'static';
      slot.appendChild(box);
      return;
    }
    document.body.appendChild(box);
    place();
    window.addEventListener('resize', place);
    setTimeout(place, 800);        // 늦게 생기는 버튼까지 보고 다시 자리 잡기
  }

  // 페이지에 원래 떠 있는 버튼(사용법 등)과 안 겹치는 구석 찾기
  var SPOTS = [
    { right: '12px', bottom: '12px' },
    { left: '12px', bottom: '12px' },
    { right: '12px', top: '70px' },
    { left: '12px', top: '70px' }
  ];
  function place() {
    if (!box) return;
    var floats = [];
    var all = document.body.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el === box || box.contains(el)) continue;
      var pos = getComputedStyle(el).position;
      if (pos !== 'fixed' && pos !== 'sticky') continue;
      var r = el.getBoundingClientRect();
      if (r.width && r.height && r.width < window.innerWidth * 0.9) floats.push(r);
    }
    for (var s = 0; s < SPOTS.length; s++) {
      box.style.left = box.style.right = box.style.top = box.style.bottom = 'auto';
      for (var k in SPOTS[s]) box.style[k] = SPOTS[s][k];
      var b = box.getBoundingClientRect(), hit = false;
      for (var j = 0; j < floats.length; j++) {
        var f = floats[j];
        if (b.left < f.right + 6 && b.right > f.left - 6 && b.top < f.bottom + 6 && b.bottom > f.top - 6) { hit = true; break; }
      }
      if (!hit) return;
    }
    box.style.left = box.style.top = 'auto';   // 다 차 있으면 오른쪽 아래, 대신 반투명
    box.style.right = box.style.bottom = '12px';
    box.style.opacity = '.75';
  }
  function iosGuide() {
    if (document.getElementById('hs-guide')) return;
    var g = document.createElement('div');
    g.id = 'hs-guide';
    g.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(40,30,60,.45);display:flex;' +
      'align-items:flex-end;justify-content:center;padding:16px';
    g.innerHTML = '<div style="background:#fff;border-radius:20px;padding:18px 20px;max-width:360px;width:100%;' +
      'font-size:16px;line-height:1.6;color:#4a4458;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.2)">' +
      '<div style="font-size:18px;font-weight:bold;margin-bottom:8px">홈 화면에 추가하기</div>' +
      '① 화면 아래(또는 주소창 옆) <b>공유 버튼 □↑</b>을 누르고<br>' +
      '② <b>홈 화면에 추가</b>를 누르세요<br>' +
      '<span style="font-size:14px;color:#9a92a8">크롬이면 주소창 오른쪽 공유 버튼이에요</span>' +
      '<div style="margin-top:12px;font-size:15px;color:#7a63b0">닫기</div></div>';
    g.onclick = function () { g.remove(); };
    document.body.appendChild(g);
  }
  function hide() { if (box) { box.remove(); box = null; } }
})();
