"""RAG 现代足球战术知识库 - 检索增强生成"""
import os
import logging
from pathlib import Path
from typing import List, Optional

logger = logging.getLogger(__name__)

KNOWLEDGE_DIR = Path(__file__).parent.parent.parent / "knowledge"


class RAGService:
    def __init__(self):
        self.knowledge_base = self._load_knowledge()

    def _load_knowledge(self) -> List[dict]:
        """加载战术知识库"""
        knowledge = []
        if KNOWLEDGE_DIR.exists():
            for file in KNOWLEDGE_DIR.glob("*.md"):
                try:
                    with open(file, "r", encoding="utf-8") as f:
                        content = f.read()
                    knowledge.append({
                        "title": file.stem,
                        "content": content,
                        "tags": self._extract_tags(content),
                    })
                except Exception as e:
                    logger.error(f"加载知识文件失败 {file}: {e}")

        # 如果没有知识文件，使用内置基础战术知识
        if not knowledge:
            knowledge = self._builtin_knowledge()

        logger.info(f"RAG 知识库加载完成，共 {len(knowledge)} 条知识")
        return knowledge

    def _extract_tags(self, content: str) -> List[str]:
        """从内容中提取标签"""
        tags = []
        keywords = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "高位逼抢", "防守反击",
                    "传控", "边路突破", "定位球", "中场控制", "防守组织"]
        for kw in keywords:
            if kw in content:
                tags.append(kw)
        return tags

    def _builtin_knowledge(self) -> List[dict]:
        """内置基础战术知识"""
        return [
            {
                "title": "4-3-3 阵型战术要点",
                "content": """4-3-3 阵型是现代足球最流行的阵型之一。
特点：中场三人配置（单后腰+双中前卫），前锋线三人（两边锋+中锋）。
优势：中场控制力强，边路进攻犀利，高位逼抢效果好。
劣势：边后卫身后空当较大，对后腰防守能力要求高。
关键球员：后腰（防守屏障+出球核心）、中锋（支点作用）、边锋（突破+内切）。""",
                "tags": ["4-3-3", "中场控制", "边路突破", "高位逼抢"],
            },
            {
                "title": "4-4-2 阵型战术要点",
                "content": """4-4-2 阵型是传统经典阵型。
特点：中场四人平行站位（两边前卫+双中前卫），前锋线两人（双前锋）。
优势：防守稳固，中场覆盖面积大，反击速度快。
劣势：中场创造力相对不足，边路依赖边前卫往返跑动。
关键球员：双前锋（一高一快组合效果最佳）、中前卫（攻防转换枢纽）。""",
                "tags": ["4-4-2", "防守反击"],
            },
            {
                "title": "高位逼抢战术",
                "content": """高位逼抢是现代足球的核心战术之一。
定义：在对方半场甚至禁区前沿实施高压逼抢，迫使对方失误。
实施要点：
1. 前锋线第一时间压迫对方中卫和门将
2. 中场线同步压上，切断传球路线
3. 后防线前提，压缩空间
4. 全队统一行动，保持阵型紧凑
优势：抢下球后离对方球门近，容易创造得分机会。
劣势：体能消耗大，一旦被打身后容易失位。
注意事项：业余球队体能有限，建议分段实施（如开场15分钟、下半场开场）。""",
                "tags": ["高位逼抢"],
            },
            {
                "title": "防守反击战术",
                "content": """防守反击是弱队胜强队的经典战术。
定义：主动放弃控球权，收缩防守，抓住对方进攻失误快速反击。
实施要点：
1. 防线收缩到本方半场，保持阵型紧凑
2. 中场球员主要负责防守和拦截
3. 保留1-2名速度快的前锋在前场
4. 抢下球后第一时间长传或直塞找前锋
优势：节省体能，利用对方压上的身后空当。
劣势：控球率低，场面被动，对前锋个人能力要求高。
关键：反击的第一传质量决定反击成败。""",
                "tags": ["防守反击"],
            },
            {
                "title": "定位球攻防要点",
                "content": """定位球是业余足球的重要得分手段。
进攻要点：
1. 角球：安排高点球员争顶，战术角球变化增加突然性
2. 任意球：直接射门 vs 配合传球，根据距离和角度选择
3. 界外球：大力手抛球可作为进攻武器
防守要点：
1. 人盯人 vs 区域防守，根据球队特点选择
2. 安排专人防守对方高点
3. 第二点保护很重要，很多进球来自第二点补射
4. 反击准备：定位球防守时留速度快的球员在前场准备反击""",
                "tags": ["定位球"],
            },
        ]

    def search(self, query: str, top_k: int = 3) -> List[dict]:
        """简单关键词检索"""
        query_lower = query.lower()
        scored = []
        for item in self.knowledge_base:
            score = 0
            # 标题匹配
            if any(kw in item["title"] for kw in query_lower.split()):
                score += 5
            # 标签匹配
            for tag in item["tags"]:
                if tag in query:
                    score += 3
            # 内容匹配
            content_lower = item["content"].lower()
            for kw in query_lower.split():
                if kw in content_lower:
                    score += 1
            if score > 0:
                scored.append((score, item))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in scored[:top_k]]

    def get_context(self, query: str) -> str:
        """获取检索到的上下文，用于 LLM 增强生成"""
        results = self.search(query)
        if not results:
            return ""
        context_parts = []
        for item in results:
            context_parts.append(f"【{item['title']}】\n{item['content']}")
        return "\n\n".join(context_parts)


_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
