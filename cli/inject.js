const headers = {
  "accept": "*/*",
  "accept-language": "zh-CN,zh;q=0.9",
  "cache-control": "no-cache",
  "content-type": "application/json;charset=UTF-8",
  "pragma": "no-cache",
  "priority": "u=1, i",
  "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
  "sec-ch-ua-mobile": "?1",
  "sec-ch-ua-platform": "\"Android\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "x-litemall-identification": "zhanhui",
  "x-litemall-token": "AHW27c1f3b1a4493db5b6bfd84a6d579add"
}

async function loginByOAuthCode(code) {
  const resp = await  fetch(`https://vrhall.ccnfgame.com/zhanhui/user/auth/loginByOAuthCode?code=${code}&state=zhanhui22`, {
    "headers": {
      "content-type": "application/json;charset=UTF-8",
      "x-litemall-identification": "zhanhui22",
      "x-litemall-token": ""
    },
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "omit"
  });
  const json = await resp.json();
const token = json.data.entity.token
return token
}

async function queryFriends() {
  const resp = await fetch("https://vrhall.ccnfgame.com/zhanhui/api/cchz/queryFriends", {
    headers,
    "referrer": "https://vrhall.ccnfgame.com/wapp/cchz/",
    "body": "",
    "method": "POST",
    "mode": "cors",
    "credentials": "omit"
  });
  const json = await resp.json();
const users = json.data.list
return users
}


async function admissionTicket(exhibitionId,) {
  const resp = await fetch(`https://vrhall.ccnfgame.com/zhanhui/api/exhibitionAdmissionTicket/admissionTicketOrder?admissionTicketId=1958193776390942721&ticketTotal=1&payType=102&exhibitionId=${exhibitionId}&appId=wx154c355d45f0b4ef&fromType=0&userAgent=5`, {
    headers,
    "referrer": "https://vrhall.ccnfgame.com/wapp/cchz/",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "omit"
  });
  const json = await resp.json();
  const entity = json.data.entity
  return entity.orderId
}

async function orderFriend(userIds, orderId) {
  fetch(`https://vrhall.ccnfgame.com/zhanhui/api/cchz/orderFriends?orderId=${orderId}`, {
    headers,
    "referrer": "https://vrhall.ccnfgame.com/wapp/cchz/",
    "body": JSON.stringify(userIds.map(i => { return { id: i } })),
    "method": "POST",
    "mode": "cors",
    "credentials": "omit"
  });
}
async function preOrder(orderId) {
  fetch(`https://vrhall.ccnfgame.com/zhanhui/wx/gonghuo/order/prepay`, {
    headers,
    "referrer": "https://vrhall.ccnfgame.com/wapp/cchz/",
    "body": JSON.stringify({
      orderId: orderId,
      payType: 102,
      payScene: 101,
      userAgent: 3
    }),
    "method": "POST",
    "mode": "cors",
    "credentials": "omit"
  });
}
// 请求通知权限
function requestNotificationPermission() {
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

// 发送通知
function showNotification(message) {
  if (Notification.permission === "granted") {
    new Notification("XXXYYY", {
      body: message,
    });
  } else {
    console.log(message);
  }
}

(async function () {
  const url = "https://vrhall.ccnfgame.com/zhanhui/api/exhibitionAdmissionTicket/list?exhibitionId=1925119716575768577&pageNo=1";
  let timer = null;
  const code  =  '071WAL0w3G8hw53UIk2w3ERql03WAL0Z'
  const token = await loginByOAuthCode(code)
  headers['x-litemall-token'] = token
  const users = await queryFriends()
  console.log(users);
  async function main() {
    try {

      
      const resp = await fetch(url, { headers, "mode": "cors", credentials: 'omit' });
      const json = await resp.json();
      const list = json.data.list
      console.log('查询余票中.......');

      const avalible = list.filter(item => {
        if (item.total > 0) {
          showNotification(`${item.name}有余票${item.total}张`);
          return true
        }
      })
      if (avalible.length > 0) {
        clearInterval(timer)
        const dates = avalible.map((item, index) => `${index + 1}:${item.name}`)
        const names = users.map((item, index) => `${index + 1}:${item.name}`)
        let date = prompt("请输入想抢的日期序号：" + dates);
        let name = prompt("请输入想抢的姓名序号,多个用空格分开：" + names);
        const index = Number(date) ? Number(date - 1) : 0
        const usersIndex = name.split(' ')
        const item = avalible[index]
        console.log(users)
        const userIds = usersIndex.map(i => users[i - 1].userId);
        console.log(userIds)
        console.dir('提交中订单中...' + userIds + item.name)


        const orderId = await admissionTicket(item.exhibitionId)
        await orderFriend(userIds, orderId)
        console.log('确认订单中...')
        await preOrder(orderId)
        console.log('抢票成功！')
      }


    } catch (e) {
      console.log(e)
    }
  }

  // 主流程
  requestNotificationPermission();
  main(); // 先运行一次
  timer = setInterval(main, 60 * 1000);
  window.ticketCheckerTimer = timer;
  console.log('自动检测已启动，每分钟检查一次。');
})();





