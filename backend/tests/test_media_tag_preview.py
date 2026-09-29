from app import models
from app.routers import media


def test_spot_search_queries_prefer_specific_landmark():
    queries = media.build_search_queries('南诏风情岛', 'spot', '大理')
    assert queries[0].startswith('nanzhao')
    assert '南诏风情岛 大理' in queries
    # 不应再以泛化「城市+风景」作为靠前查询
    assert not any(q == 'dali yunnan landmark scenic' for q in queries[:3])


def test_tag_preview_skips_excluded_gallery_image(client, db_session, monkeypatch):
    calls = {'n': 0}

    def fake_search(label, tag_type, city, exclude_urls=None):
        calls['n'] += 1
        assert exclude_urls
        return {
            'url': 'https://example.com/fresh.jpg',
            'source': 'openverse',
            'source_page': 'https://example.com/page',
            'attribution': 'Fresh',
        }

    monkeypatch.setattr(media, 'search_remote_image', fake_search)
    monkeypatch.setattr(media, 'download_and_store', lambda *args, **kwargs: '/uploads/gallery/fresh.jpg')

    # 先写入会被排除的旧缓存图
    key = media.build_cache_key('南诏风情岛', 'spot', '大理')
    db_session.add(models.MediaGalleryItem(
        cache_key=key,
        label='南诏风情岛',
        tag_type='spot',
        city='大理',
        image_url='/uploads/gallery/old-dup.jpg',
        source='remote',
        hit_count=1,
    ))
    db_session.commit()

    response = client.post('/api/media/tag-preview', json={
        'label': '南诏风情岛',
        'tag_type': 'spot',
        'city': '大理',
        'exclude_urls': ['/uploads/gallery/old-dup.jpg'],
    })
    assert response.status_code == 200
    body = response.json()['data']
    assert body['image_url'] == '/uploads/gallery/fresh.jpg'
    assert body['cached'] is False
    assert calls['n'] == 1


def test_tag_preview_uses_local_image_and_persists(client, db_session):
    response = client.post('/api/media/tag-preview', json={
        'label': '大理古城',
        'tag_type': 'spot',
        'city': '大理',
        'local_image': '/images/spots/dali.jpg',
    })
    assert response.status_code == 200
    body = response.json()['data']
    assert body['image_url'] == '/images/spots/dali.jpg'
    assert body['source'] == 'local_bundle'
    assert body['cached'] is False

    again = client.post('/api/media/tag-preview', json={
        'label': '大理古城',
        'tag_type': 'spot',
        'city': '大理',
        'local_image': '/images/spots/dali.jpg',
    })
    assert again.status_code == 200
    assert again.json()['data']['cached'] is True

    item = db_session.query(models.MediaGalleryItem).filter(models.MediaGalleryItem.label == '大理古城').first()
    assert item is not None
    assert item.hit_count >= 2


def test_tag_preview_searches_then_prefers_gallery(client, db_session, monkeypatch):
    monkeypatch.setattr(media, 'search_remote_image', lambda *args, **kwargs: {
        'url': 'https://example.com/remote.jpg',
        'source': 'openverse',
        'source_page': 'https://example.com/page',
        'attribution': 'Demo Author',
    })
    monkeypatch.setattr(media, 'download_and_store', lambda *args, **kwargs: '/uploads/gallery/demo.jpg')

    first = client.post('/api/media/tag-preview', json={
        'label': '大理乳扇',
        'tag_type': 'food',
        'city': '大理',
    })
    assert first.status_code == 200
    data = first.json()['data']
    assert data['image_url'] == '/uploads/gallery/demo.jpg'
    assert data['cached'] is False
    assert data['source'] == 'openverse'

    second = client.post('/api/media/tag-preview', json={
        'label': '大理乳扇',
        'tag_type': 'food',
        'city': '大理',
    })
    assert second.status_code == 200
    assert second.json()['data']['cached'] is True
    assert second.json()['data']['image_url'] == '/uploads/gallery/demo.jpg'

    item = db_session.query(models.MediaGalleryItem).filter(models.MediaGalleryItem.label == '大理乳扇').first()
    assert item is not None
    assert item.hit_count >= 2


def test_curated_cover_for_xiamen_university():
    assert media.resolve_curated_local_cover('厦门大学') == '/images/landmarks/xiamen_01_xida.jpg'
    assert media.resolve_curated_local_cover('厦大').endswith('xida.jpg')
    queries = media.build_search_queries('厦门大学', 'spot', '厦门')
    assert any('xiamen university' in q.lower() for q in queries)


def test_tag_preview_uses_curated_cover(client, db_session, monkeypatch):
    monkeypatch.setattr(media, 'search_remote_image', lambda *a, **k: (_ for _ in ()).throw(AssertionError('should not search')))

    response = client.post('/api/media/tag-preview', json={
        'label': '厦门大学',
        'tag_type': 'spot',
        'city': '厦门',
    })
    assert response.status_code == 200
    body = response.json()['data']
    assert body['image_url'] == '/images/landmarks/xiamen_01_xida.jpg'
    assert body['source'] == 'local_bundle'


def test_search_remote_prefers_amap(monkeypatch):
    calls = []

    def fake_amap(label, city=None, exclude=None):
        calls.append(('amap', label, city))
        return {
            'url': 'https://store.is.autonavi.com/demo.jpg',
            'source': 'amap',
            'attribution': '高德地图 · 厦门大学',
        }

    monkeypatch.setattr(media, '_search_amap_poi', fake_amap)
    monkeypatch.setattr(media, '_search_wikimedia', lambda *a, **k: (_ for _ in ()).throw(AssertionError('wiki')))
    monkeypatch.setattr(media, '_search_openverse', lambda *a, **k: (_ for _ in ()).throw(AssertionError('ov')))
    monkeypatch.setattr(media, '_search_unsplash', lambda *a, **k: (_ for _ in ()).throw(AssertionError('us')))
    monkeypatch.setattr(media, '_search_pexels', lambda *a, **k: (_ for _ in ()).throw(AssertionError('px')))

    hit = media.search_remote_image('曾厝垵', 'spot', '厦门')
    assert hit['source'] == 'amap'
    assert calls and calls[0][0] == 'amap'
