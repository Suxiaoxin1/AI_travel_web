from app.config import settings
from app.routers import ai


def test_resolve_zhipu_image_size_from_ratio():
    assert ai._resolve_zhipu_image_size('2K', '3:4') == '1056x1568'
    assert ai._resolve_zhipu_image_size('1056x1568', None) == '1056x1568'
    assert ai._resolve_zhipu_image_size(None, '1:1') == '1280x1280'


def test_vision_messages_keep_data_url_prefix():
    messages = [{'role': 'user', 'content': [
        {'type': 'text', 'text': '分析图片'},
        {'type': 'image_url', 'image_url': {'url': 'data:image/jpeg;base64,aGVsbG8='}},
    ]}]
    normalized = ai._normalize_vision_messages(messages)
    assert normalized[0]['content'][1]['image_url']['url'] == 'data:image/jpeg;base64,aGVsbG8='


def test_vision_chat_uses_zhipu_provider(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, 'ZHIPU_API_KEY', 'test-zhipu-key')
    monkeypatch.setattr(settings, 'ZHIPU_API_BASE', 'https://open.bigmodel.cn/api/paas/v4')
    monkeypatch.setattr(settings, 'ZHIPU_VISION_MODEL', 'glm-5.3-flash')
    captured = {}

    async def fake_upstream_request(method, url, *, headers, json_body=None, timeout_seconds=60):
        captured['url'] = url
        captured['headers'] = headers
        captured['body'] = json_body
        return {
            'id': 'vision-test',
            'choices': [{'message': {'role': 'assistant', 'content': '{"title":"测试"}'}}],
        }

    monkeypatch.setattr(ai, '_upstream_request', fake_upstream_request)
    response = client.post('/api/ai/chat', headers=auth_headers, json={
        'mode': 'vision',
        'messages': [{'role': 'user', 'content': [
            {'type': 'text', 'text': '分析图片'},
            {'type': 'image_url', 'image_url': {'url': 'data:image/jpeg;base64,aGVsbG8='}},
        ]}],
    })
    assert response.status_code == 200
    assert captured['url'] == 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    assert captured['body']['model'] == 'glm-5.3-flash'
    assert captured['body']['thinking'] == {'type': 'enabled'}
    assert captured['body']['reasoning_effort'] == 'low'
    assert captured['headers']['Authorization'] == 'Bearer test-zhipu-key'


def test_ai_images_uses_zhipu_glm_image(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, 'ZHIPU_API_KEY', 'test-zhipu-key')
    monkeypatch.setattr(settings, 'ZHIPU_API_BASE', 'https://open.bigmodel.cn/api/paas/v4')
    monkeypatch.setattr(settings, 'ZHIPU_IMAGE_MODEL', 'glm-image')
    captured = {}

    class FakeResponse:
        is_error = False

        def json(self):
            return {'data': [{'url': 'https://example.com/journal.jpg'}]}

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, url, headers=None, json=None):
            captured['url'] = url
            captured['headers'] = headers
            captured['body'] = json
            return FakeResponse()

    monkeypatch.setattr(ai.httpx, 'AsyncClient', FakeClient)
    response = client.post('/api/ai/images', headers=auth_headers, json={
        'prompt': '生成暖意拼贴手账',
        'size': '2K',
        'ratio': '3:4',
        'images': ['data:image/jpeg;base64,aaa', 'data:image/jpeg;base64,bbb'],
    })
    assert response.status_code == 200
    assert response.json()['data']['data'][0]['url'] == 'https://example.com/journal.jpg'
    assert captured['url'] == 'https://open.bigmodel.cn/api/paas/v4/images/generations'
    assert captured['headers']['Authorization'] == 'Bearer test-zhipu-key'
    assert captured['body']['model'] == 'glm-image'
    assert captured['body']['size'] == '1056x1568'
    assert captured['body']['quality'] == 'hd'
    assert 'ratio' not in captured['body']
    assert 'extra_body' not in captured['body']
    assert 'images' not in captured['body']


def test_ai_images_rejects_too_many_references(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, 'ZHIPU_API_KEY', 'test-zhipu-key')
    response = client.post('/api/ai/images', headers=auth_headers, json={
        'prompt': '生成手账',
        'images': [f'data:image/jpeg;base64,{index}' for index in range(7)],
    })
    assert response.status_code == 422


def test_ai_images_requires_zhipu_key(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, 'ZHIPU_API_KEY', '')
    response = client.post('/api/ai/images', headers=auth_headers, json={
        'prompt': '生成手账',
    })
    assert response.status_code == 503
