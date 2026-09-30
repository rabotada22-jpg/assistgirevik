ИИ-помощник онлайн-академии — endpoint для Vercel

1. Создайте проект на Vercel и загрузите папку api/assistant.js.
2. В настройках проекта задайте переменные окружения:
   OPENAI_API_KEY — секретный API-ключ, хранится только на сервере.
   ALLOWED_ORIGIN — точный домен опубликованного сайта, например https://example.tilda.ws.
   OPENAI_MODEL — необязательно; по умолчанию gpt-5-mini.
3. Разверните проект. Endpoint будет доступен по адресу:
   https://ИМЯ-ПРОЕКТА.vercel.app/api/assistant
4. Перед загрузкой HTML на Tilda добавьте перед кодом страницы:
   <script>window.ID_ASSISTANT_ENDPOINT='https://ИМЯ-ПРОЕКТА.vercel.app/api/assistant';</script>
5. API-ключ не вставляйте в HTML или Tilda. Не сообщайте его в чате.

Endpoint принимает POST JSON вида {"question":"...","profile":{...}} и отвечает {"answer":"..."}.
Он использует OpenAI Responses API, ограничивает длину вопроса и не сохраняет состояние ответа в API.
