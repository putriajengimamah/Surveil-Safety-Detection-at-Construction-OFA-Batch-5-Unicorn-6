from flask import Flask, render_template, request, jsonify
from process import preparation, generate_response
from datetime import datetime
from pytz import timezone

# Download nltk
preparation()

app = Flask(__name__)

# Penyimpanan sementara untuk laporan pelanggaran
laporan_pelanggaran = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route("/lapor_pelanggaran", methods=["POST"])
def lapor_pelanggaran():
    jenis_pelanggaran = request.form.get("jenisPelanggaran")
    timestamp = request.form.get("timestamp")

    # Konversi timestamp ke waktu WIB
    timestamp_wib = convert_utc_to_wib(timestamp)

    # Simpan laporan pelanggaran
    laporan_pelanggaran.append({
        "jenisPelanggaran": jenis_pelanggaran,
        "timestamp": timestamp_wib,
    })

    # Periksa jenis pelanggaran, jika sesuai, kirim laporan otomatis
    if jenis_pelanggaran == "person-no-helmet-and-no-vest":
        kirim_laporan_otomatis()

    return jsonify({"pesan": "Laporan pelanggaran diterima dengan berhasil"})

# Fungsi untuk kirim laporan otomatis
def kirim_laporan_otomatis():
    # Implementasi kirim laporan otomatis ke sistem lain atau notifikasi, contoh:
    waktu_sekarang = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"Laporan otomatis pada {waktu_sekarang}: Seseorang tidak menggunakan helmet dan vest.")
    # Tambahkan logika atau pemanggilan API untuk kirim laporan ke sistem lain atau notifikasi.

# Fungsi untuk konversi waktu UTC ke WIB
def convert_utc_to_wib(utc_timestamp):
    utc_time = datetime.strptime(utc_timestamp, "%Y-%m-%dT%H:%M:%S.%fZ")
    utc_time = utc_time.replace(tzinfo=timezone('UTC'))
    wib_time = utc_time.astimezone(timezone('Asia/Jakarta'))
    return wib_time.strftime("%Y-%m-%d %H:%M:%S")

@app.route("/dapatkan_laporan_pelanggaran")
def dapatkan_laporan_pelanggaran():
    # Layani laporan pelanggaran yang tersimpan
    return jsonify({"laporanPelanggaran": laporan_pelanggaran})

@app.route('/detection')
def detection():
    return render_template('detection.html')

# Start Chatbot
@app.route("/get")
def get_bot_response():
    user_input = str(request.args.get('msg'))
    result = generate_response(user_input)
    return result
# End Chatbot

if __name__ == '__main__':
    app.run(debug=True)