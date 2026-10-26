
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Netlify가 발급한 서명으로 요청을 검증합니다.
  // 서명 검증 기능을 연결하기 전에는 외부 요청을 허용하지 않습니다.
  return {
    statusCode: 403,
    body: "Webhook verification not configured"
  };
};
