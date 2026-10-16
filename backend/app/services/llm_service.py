"""DeepSeek 大模型服务 - 生成战术攻略、赛后复盘、赛事纪实等"""
import os
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")


class LLMService:
    def __init__(self):
        self.api_key = DEEPSEEK_API_KEY
        self.base_url = DEEPSEEK_BASE_URL
        self.model = DEEPSEEK_MODEL
        self.client = httpx.AsyncClient(timeout=60.0)

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def chat(self, system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
        """调用 DeepSeek 聊天接口"""
        if not self.is_configured:
            logger.warning("DeepSeek API Key 未配置，返回 mock 响应")
            return self._mock_response(system_prompt, user_prompt)

        try:
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": temperature,
                    "max_tokens": 2000,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"DeepSeek API 调用失败: {e}")
            return self._mock_response(system_prompt, user_prompt)

    async def generate_tactics(self, match_info: str, team_info: str) -> str:
        """生成赛前战术攻略"""
        system_prompt = """你是一名专业足球战术分析师，擅长针对业余球队制定实用战术方案。
请用中文回答，结构清晰，包含：阵型建议、关键球员、进攻战术、防守战术、注意事项。"""
        user_prompt = f"比赛信息：{match_info}\n球队信息：{team_info}\n请给出赛前战术攻略。"
        return await self.chat(system_prompt, user_prompt, temperature=0.8)

    async def generate_review(self, match_info: str, stats: str) -> str:
        """生成赛后复盘"""
        system_prompt = """你是一名专业足球评论员，擅长撰写赛后复盘文章。
请用中文回答，包含：比赛概述、关键瞬间、球员表现、战术分析、改进建议。"""
        user_prompt = f"比赛信息：{match_info}\n数据统计：{stats}\n请撰写赛后复盘。"
        return await self.chat(system_prompt, user_prompt, temperature=0.7)

    async def generate_article(self, match_info: str) -> str:
        """生成赛事纪实文章"""
        system_prompt = """你是一名体育记者，擅长撰写足球赛事纪实文章。
请用中文回答，文笔生动，包含：赛前氛围、比赛过程、精彩瞬间、赛后采访、赛事意义。"""
        user_prompt = f"比赛信息：{match_info}\n请撰写赛事纪实文章。"
        return await self.chat(system_prompt, user_prompt, temperature=0.9)

    async def generate_lineup_recommendation(self, team_info: str, opponent_info: str) -> str:
        """生成阵容推荐理由"""
        system_prompt = """你是一名足球主教练，擅长根据对手特点排兵布阵。
请用中文回答，说明：为什么选择这个阵型、每个位置的人选理由、针对对手的针对性部署。"""
        user_prompt = f"我方球队：{team_info}\n对手球队：{opponent_info}\n请给出阵容推荐理由。"
        return await self.chat(system_prompt, user_prompt, temperature=0.8)

    def _mock_response(self, system_prompt: str, user_prompt: str) -> str:
        """未配置 API Key 时的 mock 响应"""
        if "战术" in system_prompt or "战术" in user_prompt:
            return """【阵型建议】推荐 4-3-3 阵型，保持中场控制力。
【关键球员】10号核心中场、9号中锋、7号右边锋。
【进攻战术】边路突破+中路渗透结合，利用边后卫套上拉开宽度。
【防守战术】高位逼抢+中场绞杀，限制对方核心球员拿球空间。
【注意事项】注意体能分配，下半场60分钟后考虑换人调整。"""
        elif "复盘" in system_prompt or "复盘" in user_prompt:
            return """【比赛概述】双方势均力敌，比赛节奏较快。
【关键瞬间】第23分钟前锋破门，第67分钟对手扳平，补时阶段绝杀。
【球员表现】10号中场送出两次助攻，9号中锋梅开二度。
【战术分析】中场控制占优，但防守端定位球防守存在漏洞。
【改进建议】加强定位球防守训练，提升下半场体能储备。"""
        elif "纪实" in system_prompt or "纪实" in user_prompt:
            return """赛前，球迷们早早涌入球场，气氛热烈。
比赛开始后，双方展开激烈对攻。第23分钟，主队前锋抓住机会破门，全场沸腾。
下半场，客队加强攻势，第67分钟扳平比分。
补时阶段，主队边锋突破传中，中锋头球绝杀！
全场球迷欢呼雀跃，这是一场难忘的比赛。"""
        elif "阵容" in system_prompt or "阵容" in user_prompt:
            return """选择 4-3-3 阵型，针对对手边路防守薄弱的特点，加强边路进攻。
门将选择经验丰富的1号，后防线保持稳定，中场安排三名技术型球员控制节奏，
前锋线安排速度快的边锋和支点中锋，针对对手高空球劣势加强传中战术。"""
        else:
            return "AI 分析生成中，请稍后重试。"


_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
