# -*- coding: utf-8 -*-
import cv2
import numpy as np

# モザイク処理
def mosaic(img, alpha):
    # 画像の高さと幅を抽出
    w = img.shape[1]    # 幅
    h = img.shape[0]    # 高さ

    # 画像を縮小→拡大することでモザイクをいい感じに粗くする
    img = cv2.resize(img, (int(w*alpha), int(h*alpha)))
    img = cv2.resize(img, (w, h), interpolation=cv2.INTER_NEAREST) #INTER_NEAREST 最近傍補間

    # 最近傍法：粗い画像の解像度を上げる時の色の割り当て方で、相対位置的に同じ個所にある画素の色を抽出
    return img


# 顔を検出してモザイク処理をする
def face_mosaic():
    # 顔検出の識別機の読み込み
    cascade_face = cv2.CascadeClassifier("./opencv-master/data/haarcascades/haarcascade_frontalface_default.xml")

    # 動画の読み込み
    movie = cv2.VideoCapture("./cat_shiraishi.mp4")

    # 動画の幅と高さを取得
    width = int(movie.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(movie.get(cv2.CAP_PROP_FRAME_HEIGHT))
    size = (width, height)

    # 全フレーム数を取得
    frame_count = int(movie.get(cv2.CAP_PROP_FRAME_COUNT))

    # フレームレートを取得
    frame_rate = int(movie.get(cv2.CAP_PROP_FPS))
    # ★フレームレート現物調整（動画作成後に調整。元々5秒の動画が11秒になっていたので11/5を掛けた。動画毎に調整が必要）
    frame_rate = frame_rate * 11/5

    # mp4に設定
    fmt = cv2.VideoWriter_fourcc('m', 'p', '4', 'v')
    # ライター作成
    writer = cv2.VideoWriter('./face_mosaic_shiraishi.mp4', fmt, frame_rate, size)

    for i in range(frame_count):
        # フレームを取得
        ret, frame = movie.read() # retは画像があればTrue、なければFalse

        # 高速化のためにグレースケール変換
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # 顔領域の探索
        face = cascade_face.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30))

        # 顔領域を選択して処理
        for (x, y, w, h) in face:    # x, y：顔を検出したBOXの左上の角の座標 w：幅 h：高さ
            # 顔部分を切り出してモザイク処理 (y～y+h) (x～x+w)の部分を切り出す
            frame[y:y+h, x:x+w] = mosaic(frame[y:y+h, x:x+w], 0.05) # 0.05を大きくするとモザイクが細かくなる

            # 画像を1フレーム分として書き込み
            writer.write(frame)

    writer.release()
    movie.release()
    cv2.destroyAllWindows()


if __name__ == '__main__':
    face_mosaic()