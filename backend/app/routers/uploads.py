import mimetypes
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app import schemas
from app.dependencies import get_current_user
from app.storage import generate_key, upload_file

router = APIRouter()


@router.post("", response_model=schemas.CommonResponse)
def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="仅支持上传图片文件")

    content = file.file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="图片大小不能超过 10MB")

    key = generate_key("uploads", file.filename or "image.jpg")
    url = upload_file(content, file.content_type, key)
    return schemas.CommonResponse(data={"url": url, "key": key})
