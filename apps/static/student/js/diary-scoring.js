// Gemini APIキーを設定（実際の使用時は安全な方法で管理してください）
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';

async function calculatePoints(diaryContent, hashtags, imageUrl, tasks) {
    const prompt = `
日記の内容、ハッシュタグ、画像の有無、タスクの数に基づいて点数を計算してください。
以下の情報を元に、各項目の点数と合計点を算出してください：

日記の内容: ${diaryContent}
ハッシュタグ: ${hashtags.join(', ')}
画像: ${imageUrl ? '添付あり' : 'なし'}
タスクの数: ${tasks.length}

結果は以下のJSON形式で返してください：
{
  "diaryPoints": 数値,
  "hashtagPoints": 数値,
  "imagePoints": 数値,
  "taskPoints": 数値,
  "totalPoints": 数値,
  "feedback": "短いフィードバックコメント"
}
`;

    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GEMINI_API_KEY}`
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        return result;
    } catch (error) {
        console.error('Error calculating points:', error);
        return {
            diaryPoints: 0,
            hashtagPoints: 0,
            imagePoints: 0,
            taskPoints: 0,
            totalPoints: 0,
            feedback: "エラーが発生しました。"
        };
    }
}

// グローバルスコープで関数を公開
window.calculateDiaryPoints = calculatePoints;