
const BASE_HEADERS = {
  "accept": "*/*",
  "accept-language": "zh-CN,zh;q=0.9",
  "cache-control": "no-cache",
  "content-type": "application/json;charset=UTF-8",
  "pragma": "no-cache",
  "priority": "u=1, i",
  "x-litemall-identification": "zhanhui",
  "x-litemall-token": ""
};
const ADMISSION_TICKET_ID = "1958193776390942721";
const APP_ID = "wx154c355d45f0b4ef";
const EXHIBITION_LIST_URL = 'https://vrhall.ccnfgame.com/zhanhui/api/exhibitionAdmissionTicket/list?exhibitionId=1925119716575768577&pageNo=1';

// --- Token 持久化 ---
// --- Token 持久化（localStorage 版）---
function saveToken(token) {
  localStorage.setItem('token', token);
}
function loadToken() {
  return localStorage.getItem('token') || '';
}

// --- 日志输出 ---
function log(msg, data = null) {
  const now = new Date().toLocaleString();
  let logMsg = `[${now}] ${msg}`;
  if (data !== null) {
    logMsg += '\n' + JSON.stringify(data, null, 2);
  }
  logMsg += '\n-------------------------\n';
  const logArea = document.getElementById('logArea');
  logArea.value += logMsg;
  logArea.scrollTop = logArea.scrollHeight;
}

// --- 通用请求封装 ---
async function request(url, { method = 'GET', body = null, extraHeaders = {} } = {}) {
  let token = await loadToken();
  const headers = {
    ...BASE_HEADERS,
    ...extraHeaders,
    'x-litemall-token': token || '',
  };
  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = body;
  }
  let result
  try {
    const resp = await fetch(url, options);
    result = await resp.json();
    if ((result.errno && result.errno < 0) || (result.errmsg && result.errmsg.includes('登录失败'))) {
      throw new Error(result.msg||result.errmsg);
    }
    return result;
  } catch (e) {
    log('request异常', { url, result });
    throw e;
  }
}

// --- 业务请求 ---
async function loginByOAuthCode(code) {
  const url = `https://vrhall.ccnfgame.com/zhanhui/user/auth/loginByOAuthCode?code=${code}&state=zhanhui22`;
  const result = await request(url, { method: 'GET', extraHeaders: { 'x-litemall-identification': 'zhanhui22' } });
  if (!result.data || !result.data.entity || !result.data.entity.token) {
    throw new Error(result.msg || "未知错误");
  }
  return result.data.entity.token;
}

async function queryFriends() {
  const url = "https://vrhall.ccnfgame.com/zhanhui/api/cchz/queryFriends";
  const result = await request(url, { method: 'POST' });
  if (result.errno < 0) throw new Error(result.errmsg || result);
  return result.data.list || [];
}
let powArr = ''
async function admissionTicket(exhibitionId) {
  const url = `https://vrhall.ccnfgame.com/zhanhui/api/exhibitionAdmissionTicket/admissionTicketOrder?admissionTicketId=${ADMISSION_TICKET_ID}&ticketTotal=1&powArr=${powArr}&payType=102&exhibitionId=${exhibitionId}&appId=${APP_ID}&fromType=0&userAgent=5`;
  const result = await request(url, { method: 'GET' });
  if (!result.data || !result.data.entity || !result.data.entity.orderId) {
    throw new Error(result.msg || "未知错误");
  }
  return result.data.entity.orderId;
}

async function orderFriend(userIds, orderId) {
  const url = `https://vrhall.ccnfgame.com/zhanhui/api/cchz/orderFriends?orderId=${orderId}`;
  const body = JSON.stringify(userIds.map(i => ({ id: i })));
  const result = await request(url, { method: 'POST', body });
  if (result.errno !== 0) {
    throw new Error(result.msg || "未知错误");
  }
  return result;
}

async function preOrder(orderId) {
  const url = `https://vrhall.ccnfgame.com/zhanhui/wx/gonghuo/order/prepay`;
  const body = JSON.stringify({
    orderId,
    payType: 102,
    payScene: 101,
    userAgent: 3
  });
  const result = await request(url, { method: 'POST', body });
  if (result.errno !== 0) {
    throw new Error(result.msg || "未知错误");
  }
  return result;
}

async function findNonce(str, zeroCount = 4) {
  const prefix = "0".repeat(zeroCount);
  let nonce = 0;
  const start = performance.now();

  // 内部hash函数
  async function sha256Hex(input) {
      const bytes = new TextEncoder().encode(input);
      const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");
  }

  while (true) {
      const hash = await sha256Hex(str + nonce);
      if (hash.startsWith(prefix)) {
          return {
              nonce,
              hash,
              ms: (performance.now() - start).toFixed(0)
          };
      }
      nonce++;
  }
}

// --- 展会日期获取 ---
async function fetchExhibitionDates() {
  const result = await request(EXHIBITION_LIST_URL);
  return result
}

// --- 事件绑定 ---
document.addEventListener('DOMContentLoaded', () => {
  const codeInput = document.getElementById('codeInput');
  const loginBtn = document.getElementById('loginBtn');
  const queryFriendsBtn = document.getElementById('queryFriendsBtn');
  const refreshBtn = document.getElementById('refresh-btn');
  const friendsSelect = document.getElementById('friendsSelect');
  const dateSelect = document.getElementById('dateSelect');
  const grabBtn = document.getElementById('grabBtn');

  // 登录
  loginBtn.onclick = async () => {
    const code = codeInput.value.trim();
    if (!code) {
      log('请输入微信code');
      return;
    }
    try {
      const token = await loginByOAuthCode(code);
      await saveToken(token);
      log('登录成功', { token });
    } catch (e) {
      log('登录失败', { error: e.message });
    }
  };

  // 查询好友
  queryFriendsBtn.onclick = async () => {
    try {
      const friends = await queryFriends();
      friendsSelect.innerHTML = '';
      friends.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.name+' '+u.idCard;
        friendsSelect.appendChild(opt);
      });
      log('查询到好友', friends);
    } catch (e) {
      log('查询好友失败', { error: e.message });
    }
  };

  // 刷新列表
  refreshBtn.onclick = async () => {
    try {
      dateSelect.innerHTML = '<option>加载中...</option>';
      // 获取展会日期
      const result = await fetchExhibitionDates();
      const dates = result.data.list;
      console.log(dates)
      dateSelect.innerHTML = '';
      dates.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.exhibitionId;
        opt.textContent = `${d.name} ${d.content}（余票：${d.total}）`;
        dateSelect.appendChild(opt);
      });
      log('展会日期加载完成');
      const pow = result.data.entity.pow.encryptedData
      const {nonce} = await findNonce(pow,4)
      powArr = `${pow}-${nonce}`
      log('none计算完成'+powArr);
    } catch (e) {
      log('展会日期加载完成', { error: e.message });
    }
  };

  function isAutoGrab() {
    return document.querySelector('input[name="autoGrab"]:checked').value === 'yes';
  }
  function getInterval() {
    return (parseInt(document.getElementById('intervalInput').value, 10) || 2) * 1000;
  }

  let autoGrabTimer = null;

  document.getElementById('grabBtn').onclick = async function() {
    const selectedDateId = document.getElementById('dateSelect').value;
    const selectedUserIds = Array.from(document.getElementById('friendsSelect').selectedOptions).map(opt => opt.value);

    if (!selectedDateId) {
      log('请选择日期');
      return;
    }
    if (selectedUserIds.length === 0) {
      log('请选择好友');
      return;
    }

    // 判断是否自动重抢
    if (isAutoGrab()) {
      if (autoGrabTimer) return; // 防止重复启动
      log('自动重抢已启动');
      async function autoTry() {
        const success = await tryGrabTicket(selectedDateId, selectedUserIds);
        if (!success) {
          autoGrabTimer = setTimeout(autoTry, getInterval());
        } else {
          autoGrabTimer = null;
        }
      }
      autoTry();
    } else {
      await tryGrabTicket(selectedDateId, selectedUserIds);
    }
  };

  function stopAutoGrab() {
    if (autoGrabTimer) {
      clearTimeout(autoGrabTimer);
      autoGrabTimer = null;
      log('自动重抢已停止');
    }
  }
  document.querySelectorAll('input[name="autoGrab"]').forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'no') {
        stopAutoGrab();
      }
    });
  });
});

async function tryGrabTicket(selectedDateId, selectedUserIds) {
  try {
    const orderId = await admissionTicket(selectedDateId);
    await orderFriend(selectedUserIds, orderId);
    await preOrder(orderId);
    log('抢票成功', { selectedUserIds, selectedDateId, orderId });
    return true;
  } catch (e) {
    log('抢票失败', { error: e.message });
    return false;
  }
}
