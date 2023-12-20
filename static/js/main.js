var btnStart = document.getElementById("btn-start");
let nyala = true;
let stopExecution = true;
let statusPelanggaran = false;
var video;
let videoStream;
let currentViolationStatus = false;

// BARU
// Speech Synthesis Utterance
const synth = window.speechSynthesis;

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);

    // Atur parameter suara
    utterance.volume = 1; // Volume (0 hingga 1)
    utterance.rate = 1; // Kecepatan pelafalan (0.1 hingga 10)
    utterance.pitch = 1; // Tinggi suara (0 hingga 2)

    // Atur suara yang digunakan (opsional)
    // utterance.voice = speechSynthesis.getVoices().filter(voice => voice.name === 'Google UK English Female')[0];

    // Cari suara dalam bahasa Indonesia (misalnya: 'Google Bahasa Indonesia')
    const indonesianVoice = speechSynthesis.getVoices().find(voice => voice.lang === 'id-ID');

    // Jika suara dalam bahasa Indonesia ditemukan, gunakan suara tersebut
    if (indonesianVoice) {
        utterance.voice = indonesianVoice;
    } else {
        console.warn('Suara dalam bahasa Indonesia tidak ditemukan. Menggunakan suara default.');
    }

    // Lakukan pengucapan
    synth.speak(utterance);
}

function startVidio() {
    var model;
    var cameraMode = "user"; // or "environment"

    const startVideoStreamPromise = navigator.mediaDevices
        .getUserMedia({
            audio: false,
            video: {
                facingMode: {
                    exact: cameraMode,
                },
            }
        });

    if (stopExecution) {
    const video = $("video")[0];
    
    startVideoStreamPromise.then(function (stream) {
        return new Promise(function (resolve) {
            videoStream = stream; // Simpan objek stream ke variabel global
            video.srcObject = stream;
            video.onloadeddata = function () {
                video.play();
                resolve();
            };
        });
    });

    var publishable_key = "rf_B3qaty7qlcgNkqyhRfGK7GH3o2G2";
    var toLoad = {
        model: "bismillah-e3vym",
        version: 4
    };


    const loadModelPromise = new Promise(function (resolve, reject) {
        roboflow.auth({
                publishable_key: publishable_key
            })
            .load(toLoad)
            .then(function (m) {
                model = m;
                resolve();
            });
    });
  
    Promise.all([startVideoStreamPromise, loadModelPromise]).then(function () {
        $("body").removeClass("loading");
        resizeCanvas();
        detectFrame();
    });
  
    var canvas, ctx;
    const font = "16px sans-serif";
  
    function videoDimensions(video) {
        // Ratio of the video's intrisic dimensions
        var videoRatio = video.videoWidth / video.videoHeight;
  
        // The width and height of the video element
        var width = video.offsetWidth,
            height = video.offsetHeight;
  
        // The ratio of the element's width to its height
        var elementRatio = width / height;
  
        // If the video element is short and wide
        if (elementRatio > videoRatio) {
            width = height * videoRatio;
        } else {
            // It must be tall and thin, or exactly equal to the original ratio
            height = width / videoRatio;
        }
  
        return {
            width: width,
            height: height
        };
    }
  
    $(window).resize(function () {
        resizeCanvas();
    });
  
    const resizeCanvas = function () {
        $("canvas").remove();
  
        canvas = $("<canvas/>");
  
        ctx = canvas[0].getContext("2d");
  
        var dimensions = videoDimensions(video);
  
        console.log(
            video.videoWidth,
            video.videoHeight,
            video.offsetWidth,
            video.offsetHeight,
            dimensions
        );
  
        canvas[0].width = video.videoWidth;
        canvas[0].height = video.videoHeight;
  
        canvas.css({
            width: dimensions.width,
            height: dimensions.height,
            // left: ($(window).width() - dimensions.width) / 5,
            // top: ($(window).height() - dimensions.height) / 5
        });
  
        $(".loading").append(canvas);
    };
  
    const renderPredictions = function (predictions) {
        var dimensions = videoDimensions(video);
  
        var scale = 1;
  
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
        predictions.forEach(function (prediction) {
            const x = prediction.bbox.x;
            const y = prediction.bbox.y;
  
            const width = prediction.bbox.width;
            const height = prediction.bbox.height;
  
            // Draw the bounding box.
            ctx.strokeStyle = prediction.color;
            ctx.lineWidth = 4;
            ctx.strokeRect(
                (x - width / 2) / scale,
                (y - height / 2) / scale,
                width / scale,
                height / scale
            );
  
            // Draw the label background.
            ctx.fillStyle = prediction.color;
            const textWidth = ctx.measureText(prediction.class).width;
            const textHeight = parseInt(font, 10); // base 10
            ctx.fillRect(
                (x - width / 2) / scale,
                (y - height / 2) / scale,
                textWidth + 8,
                textHeight + 4
            );
        });
  
        predictions.forEach(function (prediction) {
            const x = prediction.bbox.x;
            const y = prediction.bbox.y;
  
            const width = prediction.bbox.width;
            const height = prediction.bbox.height;
  
            // Draw the text last to ensure it's on top.
            ctx.font = font;
            ctx.textBaseline = "top";
            ctx.fillStyle = "#000000";
            ctx.fillText(
                prediction.class,
                (x - width / 2) / scale + 4,
                (y - height / 2) / scale + 1
            );
        });
    };
  
    var prevTime;
    var pastFrameTimes = [];
    const detectFrame = function () {
        if (!model) return requestAnimationFrame(detectFrame);
    
        model
            .detect(video)
            .then(function (predictions) {
                requestAnimationFrame(detectFrame);
                renderPredictions(predictions);
    
                let tidakMemakaiHelm = false;
                let tidakMemakaiRompi = false;
    
                predictions.forEach(function (prediction) {
                    if (prediction.class === "no-helmet") {
                        tidakMemakaiHelm = true;
                    } else if (prediction.class === "no-vest") {
                        tidakMemakaiRompi = true;
                    }
                });
    
                // Periksa pelanggaran dan kirim laporan
                if (tidakMemakaiHelm && tidakMemakaiRompi) {
                    if (!currentViolationStatus) {
                        kirimLaporanPelanggaran("person-no-helmet-and-no-vest");
                        currentViolationStatus = true;
                        // BARU
                        speak("Peringatan! Seseorang tidak menggunakan helm dan rompi.");
                    }
                } else if (tidakMemakaiHelm) {
                    if (!currentViolationStatus) {
                        kirimLaporanPelanggaran("person-no-helmet");
                        currentViolationStatus = true;
                        speak("Peringatan! Seseorang tidak menggunakan helm.");
                    }
                } else if (tidakMemakaiRompi) {
                    if (!currentViolationStatus) {
                        kirimLaporanPelanggaran("person-no-vest");
                        currentViolationStatus = true;
                        speak("Peringatan! Seseorang tidak menggunakan rompi.");
                    }
                } else {
                    // Tidak ada pelanggaran, setel statusPelanggaran menjadi false
                    currentViolationStatus = false;
                }
            })
            .catch(function (e) {
                console.log("Error mendeteksi frame:", e);
                requestAnimationFrame(detectFrame);
            });
    };

    // BARU
    detectFrame();
    
} else{

    startVideoStreamPromise.then(function (stream) {
        return new Promise(function (resolve) {
            video.srcObject = stream;
            video.onloadeddata = function () {
                video.pause();
                resolve();
            };
        });
    });

    return
}
};

  
  // Fungsi untuk mengirim laporan pelanggaran ke server
function kirimLaporanPelanggaran(jenisPelanggaran) {
    // Anda dapat menggunakan AJAX atau fetch untuk mengirim data ke server
    $.ajax({
        type: "POST",
        url: "/lapor_pelanggaran",
        data: {
            jenisPelanggaran: jenisPelanggaran,
            timestamp: new Date().toISOString(),
        },
        success: function (response) {
            console.log("Laporan pelanggaran berhasil dikirim");
        },
        error: function (error) {
            console.error("Error mengirim laporan pelanggaran:", error);
        },
    });
}

// const deteksiFrame = function () {
//     if (!model) return requestAnimationFrame(deteksiFrame);

//     model
//         .detect(video)
//         .then(function (prediksi) {
//             requestAnimationFrame(deteksiFrame);
//             renderPrediksi(prediksi);

//             let tidakMemakaiHelm = false;
//             let tidakMemakaiRompi = false;

//             prediksi.forEach(function (pred) {
//                 if (pred.class === "no-helmet") {
//                     tidakMemakaiHelm = true;
//                 } else if (pred.class === "no-vest") {
//                     tidakMemakaiRompi = true;
//                 }
//             });

//             // Periksa pelanggaran dan kirim laporan
//             if (tidakMemakaiHelm && tidakMemakaiRompi) {
//                 statusPelanggaran = true;
//                 kirimLaporanPelanggaran("person-no-helmet-and-no-vest");
//             } else if (tidakMemakaiHelm) {
//                 statusPelanggaran = true;
//                 kirimLaporanPelanggaran("person-no-helmet");
//             } else if (tidakMemakaiRompi) {
//                 statusPelanggaran = true;
//                 kirimLaporanPelanggaran("person-no-vest");
//             } else {
//                 // Tidak ada pelanggaran, setel statusPelanggaran menjadi false
//                 statusPelanggaran = false;
//             }
//         })
//         .catch(function (e) {
//             console.log("Error mendeteksi frame:", e);
//             requestAnimationFrame(deteksiFrame);
//         });
// };

function periksaDanKirimLaporanOtomatis() {
    if (statusPelanggaran) {
        // Panggil fungsi kirim laporan dengan jenis pelanggaran yang sesuai
        kirimLaporanPelanggaran("person-no-helmet-and-no-vest");

        // Atur agar fungsi ini dipanggil kembali setelah beberapa detik
        setTimeout(periksaDanKirimLaporanOtomatis, 5000); // Ganti angka 5000 dengan interval yang diinginkan (dalam milidetik)
    } else {
        // Tidak ada pelanggaran, atur agar fungsi ini dipanggil kembali setelah beberapa detik
        setTimeout(periksaDanKirimLaporanOtomatis, 1000); // Ganti angka 1000 dengan interval yang diinginkan (dalam milidetik)
    }
}

function downloadLaporan() {
    // Dapatkan data laporan pelanggaran
    $.ajax({
        type: "GET",
        url: "/dapatkan_laporan_pelanggaran",
        success: function (response) {
            // Buat data CSV dari laporan pelanggaran
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Jenis Pelanggaran,Waktu\n";

            response.laporanPelanggaran.forEach(function (laporan) {
                csvContent += `${laporan.jenisPelanggaran},${laporan.timestamp}\n`;
            });

            // Buat elemen <a> untuk mengunduh file CSV
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "laporan_pelanggaran.csv");
            document.body.appendChild(link);

            // Klik otomatis pada elemen <a> untuk memulai unduhan
            link.click();

            // Hapus elemen <a> setelah unduhan selesai
            document.body.removeChild(link);
        },
        error: function (error) {
            console.error("Error mendapatkan laporan pelanggaran:", error);
        },
    });
}

// Panggil fungsi untuk pertama kali
periksaDanKirimLaporanOtomatis();

  btnStart.addEventListener("click", function() {

    if(nyala){
        btnStart.textContent = "Stop";
        nyala = false;
        stopExecution = true;
        startVidio();
        periksaDanKirimLaporanOtomatis(); // Panggil fungsi periksa dan kirim laporan otomatis saat memulai
    }else{
        btnStart.textContent = "Start";
        nyala = true;
        stopExecution = false;

        // Hentikan aliran video saat tombol "Stop" diklik
        if (videoStream) {
            const tracks = videoStream.getTracks();
            tracks.forEach(track => track.stop());
        }
    }

  });