    本项目利用区块链天然的去中心化和防篡改的优势，借鉴现有聊天工具的设计思路，在界面和用户  
体验上，融合部分微创新元素以符合用户的定制化聊天需求。
    本项目主要研究基于区块链技术的去中心化聊天工具，该平台具备高可用、稳定性高、可扩展性强  
等优点，通过客户端（安卓，Ios,Web），用户可以发送文字、语音、图片、红包、表情消息、  
阅后即焚，另外，作为区别于传统中心化聊天工具的特色功能：用户可以将好友信息记录到区块链  
上，实现去中心化好友体系，也可以自主保存聊天记录。
    对注册登录的用户进行公钥、私钥、助记词的创建、绑定、密码设置和上传，主要用于加密、解密  
用户聊天记录、用户名、群名等隐私信息；
    助记词用于保护私钥隐私安全，密聊密码用于保护助记词安全，用户只需设置密聊密码并自行保  
管，程序自动创建公私钥，加密生成助记词，再次用密聊密码加密助记词上传服务端；  
    用户可通过输入密聊密码在其他设备登录账号时，解密旧设备的聊天记录、用户名、群名等隐私信  
息，防止加密消息丢失；若用户丢失密聊密码，则无法解密隐私信息，但也可设置新的密聊密码创  
建新的助记词从而创建新的私钥，开始新的加密聊天；  
    用户间传输消息时，采用非对称加密公私钥，仅参与者可加密解密消息，服务端获取用户的公钥，  
无法解密查看加密消息内容，只负责传输加密消息文件，客户端通过用户的私钥对加密文件进行解  
密。
    用户可私聊或群聊中使用隐私聊天模式，即阅后即焚模式，发送的消息会在对方查看过后一定时间  
内自动删除，双方均不留痕迹，保障私密聊天的隐私性。  
主要技术运用：  
    1、采用分布式认证技术，通过分布式部署实现一套高并发、高可用的用户登陆认证服务。  
    2、采用资源池技术，保证高并发请求的同时，节省服务器资源。  
    3、采用“手机号+验证码”技术，终端在登陆时上报验证码，服务端在认证过程中对此验证码进行  
合法性校验，保障用户账户的安全性。  
    4、采用心跳机制，保证客户端和服务端连接的实时在线状态。  
    5、采用消息确认机制，保证客户端不丢消息。  
    6、采用非对称消息加密技术，保证消息只有参与方可见，即使服务端也无法破解，实现隐私聊  
天。
