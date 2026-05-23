/**
 * `publish_templates.ts` — 内容发布模板集合（task 9.6）。
 *
 * **契约（requirements.md R29.21–24 + R27.2）：**
 *   - 视频脚本 ≥ 5 套，每套含开头/中间/结尾三段
 *   - 发布文案 ≥ 5 套
 *   - 话题标签 ≥ 10 个，**必含** `#次元小镇 #二次元搭子 #漫展搭子 #Cos搭子`
 *   - 合拍模板 ≥ 3 套
 *
 * **占位符约定**：模板字符串中 `{mascot_name}` / `{convention_name}` /
 * `{ip}` / `{partner_name}` / `{cos_character}` 等占位符，由 task 18.6
 * 的 `Content_Publishing_Funnel` 在生成草稿时按上下文替换。
 */
import type { PublishTemplates } from '@erciyuan/types'

/**
 * 内容发布模板单一聚合常量。
 *
 * 由 `Content_Publishing_Funnel`（task 18.6）作为草稿生成的素材池消费。
 */
export const publishTemplates: PublishTemplates = {
  // ─── 视频脚本 ≥ 5 套（开/中/结三段式） ──────────────────────────────────
  scripts: [
    {
      template_id: 'script_cos_duet_001',
      name: '同款 cos 双人合拍 · 高燃武戏向',
      intro: '开头 0–3s：黑屏 + 双方面具特写 + 一句 catchphrase 「{cos_character}降临」',
      middle:
        '中段 3–18s：双人 45° 仰角同步动作 4 拍 → 镜头平移切换 →' +
        '一段慢镜头对峙（带光斑滤镜）→ 互相递武器道具',
      outro: '结尾 18–25s：合拍定格 pose + 出片标语「{mascot_name} × {partner_name} · 同框」',
      suitable_companion_types: ['cos', 'duet', 'photo'],
    },
    {
      template_id: 'script_convention_vlog_002',
      name: '漫展 vlog · 一日逛吃路线',
      intro: '开头 0–4s：晨光中走向场馆 + 大门牌特写 + 「{convention_name} 我们来啦」',
      middle:
        '中段 4–60s：5 个打卡点剪辑（限定立牌、cos 走秀、谷子摊、痛包 wall、午饭吐槽），' +
        '每点 8–10s + 角标显示打卡时间',
      outro: '结尾 60–70s：双方手举战利品大合照 + 字幕「下届 {convention_name} 见」',
      suitable_companion_types: ['convention', 'booth', 'goods', 'same_city'],
    },
    {
      template_id: 'script_unboxing_003',
      name: '谷子开箱 · 痛包整理 ASMR',
      intro: '开头 0–3s：拆封声 ASMR + 快递盒 logo 特写',
      middle:
        '中段 3–35s：每件谷子单独展示 5s（吧唧、立牌、抱枕、徽章），近景手部 + ' +
        '配文「{ip} · {cos_character} 限定首发」',
      outro: '结尾 35–45s：全套谷子摆在痛包上的全景 + 「{mascot_name} 的本命 wall 又升级了」',
      suitable_companion_types: ['goods', 'limited', 'same_ip'],
    },
    {
      template_id: 'script_doujin_collab_004',
      name: '二创合作 · 四格漫画过程展示',
      intro: '开头 0–3s：白纸特写 + 铅笔落下 + 「今天和 {partner_name} 联画一张 {ip}」',
      middle:
        '中段 3–55s：分屏左侧线稿、右侧上色，6 倍速过程；穿插 2 段双方语音吐槽 ' +
        '「这里要不要画爆血管」「再加一格」',
      outro: '结尾 55–70s：成品四格平铺展示 + 「关注 {mascot_name} 看完整本」',
      suitable_companion_types: ['doujin', 'cos'],
    },
    {
      template_id: 'script_newbie_guide_005',
      name: '新人入坑指南 · 第一次漫展速通',
      intro: '开头 0–4s：「第一次去 {convention_name} 怎么办？」字幕 + 萌新捂脸表情',
      middle:
        '中段 4–55s：5 条贴士各 10s（带什么、穿什么、几点去、怎么吃、怎么聊天），' +
        '每条配 emoji 标题与小红书风信息卡',
      outro: '结尾 55–65s：老带新合影 + 「跟 {partner_name} 一起就不会怕了」',
      suitable_companion_types: ['newbie', 'same_city', 'convention'],
    },
    {
      template_id: 'script_limited_drop_006',
      name: '限定狙击实录 · 抢票/抢购 0 漏战报',
      intro: '开头 0–3s：手机倒计时 03:00:00 特写 + 「今晚 0 点 {ip} 限定」',
      middle:
        '中段 3–40s：分屏多账号待机 → 0:00 同时点击 → 进度条 → 抢到截图特写 + 庆祝声',
      outro: '结尾 40–50s：限定到货上墙 + 「{mascot_name} 限定狼出击 · 0 漏」',
      suitable_companion_types: ['limited', 'goods'],
    },
  ],

  // ─── 发布文案 ≥ 5 套 ────────────────────────────────────────────────────
  captions: [
    {
      template_id: 'caption_match_success_001',
      name: '搭子匹配成功 · 默认款',
      body:
        '今天在次元小镇匹配到了 {partner_name}！我们的共同点是 {common_interest}，' +
        '约好周末一起去 {convention_name}~ 谁懂同好相遇的快乐！🌸',
    },
    {
      template_id: 'caption_cos_collab_002',
      name: 'Cos 双人合拍 · 仪式感款',
      body:
        '{ip} {cos_character} × {partner_cos_character}，' +
        '从妆造到武器我们对了一周。第一次跟 {partner_name} 合拍就拿出了这种构图！' +
        '感谢次元小镇 · 我们做到了。',
    },
    {
      template_id: 'caption_unboxing_003',
      name: '谷子开箱 · 战利品款',
      body:
        '{convention_name} 三天，{ip} 限定全套，0 漏！' +
        '感谢 {partner_name} 在抢购 0 点跟我并肩。痛包又满了，' +
        '下次见就得换更大的痛包了 hhh',
    },
    {
      template_id: 'caption_newbie_first_004',
      name: '萌新第一次 · 治愈款',
      body:
        '我第一次去漫展……差点不敢进门。还好 {partner_name} 在门口等我，' +
        '陪我从入门到合影到挑第一支吧唧。萌新友好这件事，原来真的存在。',
    },
    {
      template_id: 'caption_doujin_release_005',
      name: '同人本上架 · 安利款',
      body:
        '《{doujin_title}》四格本上架了。和 {partner_name} 联画了一周，' +
        '从 OOC 大战到分镜重画三遍。喜欢 {ip} 的可以收藏一下吗？私信发限定贴纸。',
    },
    {
      template_id: 'caption_buzz_recap_006',
      name: '现场播报 · 鸽派款',
      body:
        '今晚 {convention_name} 现场最炸的瞬间在这里：{highlight_moment}！' +
        '本鸽蹲了 4 小时给大家第一手图。点赞够 1000 我去蹲下届首日开门第一秒。',
    },
  ],

  // ─── 话题标签 ≥ 10 个，必含硬性 4 个（R29.23） ──────────────────────────
  hashtags: [
    '#次元小镇',
    '#二次元搭子',
    '#漫展搭子',
    '#Cos搭子',
    '#角色cos',
    '#漫展vlog',
    '#限定谷子',
    '#萌新求带',
    '#同人二创',
    '#吧唧痛包',
    '#二次元穿搭',
    '#拍立得扩列',
    '#手办开箱',
    '#动画解说',
  ],

  // ─── 合拍模板 ≥ 3 套 ────────────────────────────────────────────────────
  duets: [
    {
      template_id: 'duet_mirror_001',
      name: '镜面对位合拍',
      description:
        '上下分屏，双方做镜像同步动作（举手 → 转身 → 出招）4 拍即可。' +
        '建议 BGM 选 4 拍鼓点；机位均使用半身近景，景别一致。',
    },
    {
      template_id: 'duet_relay_002',
      name: '接力剪辑合拍',
      description:
        '上半段我先 cos 一段招式（5s）→ 切到对方接同一招式（5s）→ 最后 5s 双人定格。' +
        '建议各自单机位拍摄，提交后由其中一方剪辑拼接，时长共 15s。',
    },
    {
      template_id: 'duet_dialogue_003',
      name: '台词对手戏合拍',
      description:
        '复刻原作经典对话片段（≤ 6 句），双方各拍 3 句近景台词，剪辑时按对话顺序交替。' +
        '建议附加日字幕做仪式感。',
    },
    {
      template_id: 'duet_walkthrough_004',
      name: '漫展同框逛摊合拍',
      description:
        '一人前置镜头自拍走在前面解说，另一人后置镜头跟拍逛摊画面，剪辑分屏左右拼接。' +
        '建议保留现场环境音，仪式感拉满。',
    },
  ],
}
