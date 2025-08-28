import fetch from 'node-fetch';
import readlineSync from 'readline-sync';
import fs from 'fs';
import path from 'path';

// 日志文件路径
const LOG_PATH = path.resolve(process.cwd(), 'ticket_log.txt');

function log(msg, data = null) {
  const now = new Date().toISOString();
  let logMsg = `[${now}] ${msg}`;
  if (data !== null) {
    logMsg += '\n' + JSON.stringify(data, null, 2);
  }
  logMsg += '\n-------------------------\n';
  fs.appendFileSync(LOG_PATH, logMsg, 'utf8');
}

function sysNotify(title, message) {
  console.log(`[系统提醒] ${title}: ${message}`);
}

// -------- 配置区 --------
const EXHIBITION_LIST_URL = 'https://vrhall.ccnfgame.com/zhanhui/api/exhibitionAdmissionTicket/list?exhibitionId=1925119716575768577&pageNo=1';

const BASE_HEADERS = {
  "accept": "*/*",
  "accept-language": "zh-CN,zh;q=0.9",
  "cache-control": "no-cache",
  "content-type": "application/json;charset=UTF-8",
  "pragma": "no-cache",
  "priority": "u=1, i",
  "x-litemall-identification": "zhanhui",
  "x-litemall-token": "" // 登录后自动填充
};

const ADMISSION_TICKET_ID = "1958193776390942721";
const APP_ID = "wx154c355d45f0b4ef";

// Token 文件路径
const TOKEN_FILE = path.resolve(process.cwd(), 'token.txt');

// 保存 Token 到文件
function saveToken(token) {
  fs.writeFileSync(TOKEN_FILE, token, 'utf8');
  log('Token 已保存', { TOKEN_FILE });
}

// 从文件加载 Token
function loadToken() {
  if (fs.existsSync(TOKEN_FILE)) {
    const token = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    log('Token 已从文件加载', { TOKEN_FILE });
    return token;
  }
  return null;
}

// -------- 通用请求封装 --------
async function request(url, { method = 'GET', body = null, extraHeaders = {} } = {}) {
  let token = loadToken();
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
    // token 失效判断（errno -1 或 errmsg 含“登录失败”）
    if ((result.errno && result.errno < 0) || (result.errmsg && result.errmsg.includes('登录失败'))) {
      throw new Error(result);
    }
    return result;
  } catch (e) {
    log('request异常', { url, error: result });
    throw e;
  }
}

// -------- 核心功能 --------
// 改造后的登录、查询、下单等函数
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

async function admissionTicket(exhibitionId) {
  const url = `https://vrhall.ccnfgame.com/zhanhui/api/exhibitionAdmissionTicket/admissionTicketOrder?admissionTicketId=${ADMISSION_TICKET_ID}&ticketTotal=1&payType=102&exhibitionId=${exhibitionId}&appId=${APP_ID}&fromType=0&userAgent=5`;
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

// -------- 主任务流程 --------

async function main() {
  let token = loadToken();
  let friends = [];
  let shouldLogin = true;

  if (token) {
    try {
      friends = await queryFriends();
      if (friends.length > 0) {
        log('使用保存的Token登录成功', { token });
        console.log('登录成功', '已使用保存的token');
        shouldLogin = false;
      } else {
        log('保存的Token已失效或无好友', {});
      }
    } catch (e) {
      log('使用保存的Token查询好友失败', { error: e.message });
    }
  }

  if (shouldLogin) {
    const code = readlineSync.question('自动登录失败，请输入登录code（从微信授权跳转URL中获取）: ').trim();
    try {
      token = await loginByOAuthCode(code);
      saveToken(token);
      log('登录成功', { token });
      console.log('登录成功', '已获取token');
      friends = await queryFriends();
    } catch (e) {
      console.log('登录失败', e.message);
      process.exit(1);
    }
  }

  if (!friends.length) {
    log('未查询到可用好友', {});
  } else {
    log('查询到好友', friends);
  }

  const resp = await request(EXHIBITION_LIST_URL);
  const pollResult = resp;
  const list = pollResult.data.list || [];
  list.forEach((item, idx) => {
    console.log(`${idx + 1}: ${item.name}`);
  });
  // 选日期
  const dateIdx = readlineSync.question('请输入想抢的日期序号: ');
  const item = list[Number(dateIdx) - 1];

  friends.forEach((u, idx) => {
    console.log(`${idx + 1}: ${u.name}`);
  });
  const nameIdxStr = readlineSync.question('请输入想抢的姓名序号,多个用空格分开（留空仅为自己）: ');
  let userIds = [];
  if (nameIdxStr.trim()) {
    userIds = nameIdxStr
      .trim()
      .split(' ')
      .map(i => friends[Number(i) - 1]?.userId)
      .filter(Boolean);
  }

  // Step 5: 定时轮询
  let timer = null;
  async function poll() {
    let pollResult;
    try {
      const resp = await request(EXHIBITION_LIST_URL);
      pollResult = resp;
      log('余票查询', { url: EXHIBITION_LIST_URL, pollResult });

      const list = pollResult.data.list || [];
      console.log(`[${new Date().toLocaleTimeString()}] 查询余票...`);
      const available = list.filter(item => item.total > 0);
      if (!available.length > 0) {
        sysNotify('发现余票', `${available.map(i => i.name).join(',')}`);
        available.forEach((item, idx) => {
          console.log(`${idx + 1}: ${item.name} 剩余: ${item.total}`);
        });
        if (!available.includes(item)) {
          console.log('匹配日期成功！')
          // 下单流程
          const orderId = await admissionTicket(item.exhibitionId);
          await orderFriend(userIds, orderId);
          await preOrder(orderId);
          log('抢票成功', { userIds, item, orderId });
          sysNotify('抢票成功', `${item.name}`);
          clearInterval(timer);
          process.exit(0);
        } else {
          console.log(`无票`);
        }

      }
    } catch (err) {
      log('轮询异常', { error: err.message, pollResult });
    }
  }

  poll(); // 启动即查一次
  timer = setInterval(poll, Math.random() * 1000 + 1000);
  console.log('自动检测已启动，每秒检查一次。日志文件: ticket_log.txt');
}

// 启动
main();