# API 接口文档

## 1. 登录

### 1.1 通过 OAuth Code 登录

- **方法**：GET  
- **URL**：  
  ```
  https://vrhall.ccnfgame.com/zhanhui/user/auth/loginByOAuthCode?code=${code}
  ```
- **参数**：
  - `code`：微信授权返回的 code
- **描述**：通过微信 OAuth code 进行登录认证。

---

## 2. 随行人员管理

### 2.1 添加随行人员

- **方法**：POST  
- **URL**：  
  ```
  https://vrhall.ccnfgame.com/zhanhui/api/cchz/addFriends
  ```
- **Body**（JSON 示例）：
  ```json
  {
    "name": "杨家东",
    "idCard": "532524198510012256 ",
    "phone": "18348924894"
  }
  ```
- **描述**：添加随行人员信息。

---

### 2.2 查询随行人员

- **方法**：POST  
- **URL**：  
  ```
  https://vrhall.ccnfgame.com/zhanhui/api/cchz/queryFriends
  ```
- **Body**（JSON 示例）：
  ```json
  {
    "name": "杨家东",
    "idCard": "532524198510012256 ",
    "phone": "18348924894"
  }
  ```
- **描述**：查询随行人员信息。

---

## 3. 展会门票

### 3.1 查询展会门票列表

- **方法**：GET  
- **URL**：  
  ```
  https://vrhall.ccnfgame.com/zhanhui/api/exhibitionAdmissionTicket/admissionTicketOrder?admissionTicketId=1958193776390942721&ticketTotal=1&payType=102&exhibitionId=1925119716575768577&appId=wx154c355d45f0b4ef&fromType=0&userAgent=5
  ```
- **参数**：
  - `admissionTicketId`：门票ID
  - `ticketTotal`：门票数量
  - `payType`：支付类型
  - `exhibitionId`：展会ID
  - `appId`：微信AppID
  - `fromType`：来源类型
  - `userAgent`：用户代理
- **描述**：查询展会门票订单列表。

---

### 3.2 生成订单

- **方法**：POST  
- **URL**：  
  ```
  https://vrhall.ccnfgame.com/zhanhui/api/exhibitionAdmissionTicket/admissionTicketOrder?admissionTicketId=${ADMISSION_TICKET_ID}&ticketTotal=1&powArr=${powArr}&payType=102&exhibitionId=${exhibitionId}&appId=${APP_ID}&fromType=0&userAgent=5
  ```
- **参数**（URL）：
  - `admissionTicketId`：门票ID
  - `ticketTotal`：门票数量
  - `powArr`：权限数组
  - `payType`：支付类型
  - `exhibitionId`：展会ID
  - `appId`：微信AppID
  - `fromType`：来源类型
  - `userAgent`：用户代理
- **描述**：生成展会门票订单。

---

## 4. 订单随行人管理

### 4.1 添加订单随行人

- **方法**：POST  
- **URL**：  
  ```
  https://vrhall.ccnfgame.com/zhanhui/api/cchz/orderFriends?orderId=${orderId}
  ```
- **参数**（Query）：
  - `orderId`：订单ID
- **Body**（JSON 示例）：
  ```json
  [
    { "id": "68ad2231285cd64205a23f" }
  ]
  ```
- **描述**：为订单添加随行人。

---

## 5. 预订相关

### 5.1 预订接口

- **方法**：POST  
- **URL**：  
  ```
  /zhanhui/wx/gonghuo/order/prepay
  ```
- **描述**：预订接口，具体参数需参考实际业务。

---

## 6. 微信授权相关

### 6.1 获取微信授权 code

- **URL**：  
  ```
  https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx154c355d45f0b4ef&redirect_uri=https%3A%2F%2Fvrhall.ccnfgame.com%2Fwapp&response_type=code&scope=snsapi_userinfo
  ```
- **描述**：跳转到微信开放平台获取授权 code。

---

### 6.2 微信授权回调

- **方法**：GET  
- **URL**：  
  ```
  https://vrhall.ccnfgame.com/wapp/cchz/?code=${code}&state=
  ```
- **参数**：
  - `code`：微信授权返回的 code
  - `state`：状态参数
- **描述**：微信授权后的回调接口。

---

## 每天放票总数统计
| 日期   | 9.19   | 9.20   | 9.21   | 9.22   | 9.23   |
|--------|--------|--------|--------|--------|--------|
| 8.26   | 15608  | 31347  | 30082  | 27996  | 27984  |
| 8.27   | 18608  | 36347  | 35082  | 32996  | 32984  |
| 8.28   | 21608  | 41347  | 40082  | 37996  | 37984  |
| 8.28   | 24608  | 46347  | 45082  | 42996  | 42984  |