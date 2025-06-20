import { useEffect, useState } from 'react'
import axios from 'axios';
import voiceFrequencyImg from '../assets/images/voiceFrequencyImg.png';
import checkGif from '../assets/images/checkGif.gif';
import crossGif from '../assets/images/crossGif.gif';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import SoundWave from '../components/SoundWave';
const URL = import.meta.env.VITE_URL;

const RecentPlayed = () => {
    const [show, setShow] = useState(false);
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState(null);
    const [activeCardId, setActiveCardId] = useState(null);

    const [submitted, setSubmitted] = useState({});

    const { id } = useParams()

    const [currentQuestion, setCurrentQuestion] = useState(null);

    const [speechStates, setSpeechStates] = useState({});
    const updateSpeechState = (id, updates) => {
        setSpeechStates(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                ...updates
            }
        }));
    };




    const [data, setData] = useState();
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1); // to store total pages

    const getData = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const bodyFormData = new FormData();
            bodyFormData.append('category_id', id);

            const response = await axios.post(`${URL}/listening-questions`,
                bodyFormData, // body
                {
                    params: { page: page }, // query param
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                setData(response.data);
                setTotalPages(response.data.total || 1);
            } else {
                console.error('Failed to fetch:', response.status);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };


    useEffect(() => {
        getData();
    }, [page])


    const handleOpen = (question) => {
        setCurrentQuestion(question);
        setShow(true);
        setAnswer('');
        setResult(null);
    };


    const handleClose = () => {
        setShow(false);
        setResult(null);
        setAnswer('');
    };

    const handleSubmit = () => {
        if (!currentQuestion) return;

        const userAnswer = answer.trim();
        const correctAnswer = currentQuestion.answer?.trim();

        // Mark this question as answered
        setSubmitted(prev => ({
            ...prev,
            [currentQuestion.id]: true
        }));

        if (userAnswer === correctAnswer) {
            setResult('correct');
        } else {
            setResult('wrong');
        }
    };



    const handleReattempt = () => {
        setAnswer('');
        setResult(null);
    };

    const preprocessMathExpression = (expression) => {
        return expression
            .replace(/-/g, ' minus ')
            .replace(/\+/g, ' plus ')
            .replace(/!/g, '')        // Remove the factorial symbol
            .replace(/\s+/g, ' ')     // Normalize extra spaces
            .trim();
    };



    return (
        <>
            <div className="main-container bg-theme ">
                <Header data={{ title: '', detail: 'recent-played', description: '' }} />
                <div className="container-fluid">
                    <div className="container">
                        <div className="row py-4">

                            {data?.data?.map((item, index) => {
                                const state = speechStates[item.id] || { isPaused: false, isSpeaking: false };

                                const speakText = (text) => {
                                    window.speechSynthesis.cancel();

                                    const processedText = preprocessMathExpression(text);  // Clean the input
                                    const utterance = new SpeechSynthesisUtterance(processedText);
                                    utterance.lang = 'en-IN';

                                    const voices = window.speechSynthesis.getVoices();
                                    const indianVoice = voices.find(voice => voice.lang === 'en-IN');
                                    if (indianVoice) {
                                        utterance.voice = indianVoice;
                                    } else {
                                        console.warn('Indian English voice not found, using default voice');
                                    }

                                    utterance.onend = () => updateSpeechState(item.id, { isSpeaking: false, isPaused: false });
                                    utterance.onerror = (e) => {
                                        console.error("Speech synthesis error:", e);
                                        updateSpeechState(item.id, { isSpeaking: false, isPaused: false });
                                    };

                                    updateSpeechState(item.id, { isSpeaking: true, isPaused: false });

                                    if (voices.length === 0) {
                                        window.speechSynthesis.onvoiceschanged = () => {
                                            speakText(text); // Retry after voices are loaded
                                        };
                                    } else {
                                        window.speechSynthesis.speak(utterance);
                                    }
                                };


                                const handleReady = () => speakText('Ready');
                                const handleQuestion = () => speakText(item.question);
                                const handleStop = () => {
                                    window.speechSynthesis.pause();
                                    updateSpeechState(item.id, { isPaused: true, isSpeaking: false });
                                };

                                const isActive = item.id === activeCardId;

                                return (
                                    <div key={item.id} className="col-12 col-md-6 col-xl-4 mb-3">
                                        <div
                                            className={`card border-0 rounded-4 shadow-sm ${submitted[item.id]
                                                ? 'border-success border-2' // ✅ Green if answered
                                                : isActive
                                                    ? 'border-1DE2CF border-2' // Blue if active
                                                    : 'border-white'          // Default
                                                }`}
                                            onClick={() => setActiveCardId(item.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {submitted[item.id] && (
                                                <span className="badge bg-success position-absolute top-0 end-0 m-2">✔ Answered</span>
                                            )}
                                            <div className="card-body p-2">
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h6 className="text-505050 fw-semibold mb-0 fs-20">Q. No : {index + 1}</h6>

                                                    <div className={`${isActive ? 'd-block' : 'd-none'}`}>
                                                        <SoundWave />
                                                    </div>
                                                </div>
                                                <div className="d-flex flex-wrap justify-content-between align-items-center">
                                                    <button className="btn btn-yellow rounded-pill fs-20 mb-2" onClick={handleReady} disabled={!isActive} >Ready</button>
                                                    <button className="btn btn-purple rounded-pill fs-20 mb-2" onClick={handleQuestion} disabled={!isActive} >Question</button>
                                                    <button
                                                        className="btn btn-green rounded-pill fs-20 mb-2"
                                                        onClick={() => handleOpen(item)}
                                                        disabled={!isActive} >
                                                        Answer
                                                    </button>
                                                    <button className="btn btn-pink rounded-pill fs-20 mb-2" onClick={handleStop} disabled={!isActive} >Stop</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}


                        </div>


                        <div className="d-flex justify-content-center align-items-center py-4 pagination-wrapper">
                            <button
                                className="pagination-btn mx-2"
                                disabled={page === 1}
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                            >
                                <i className="fa-solid fa-angles-left"></i>
                            </button>

                            <span className="page-info fs-5 mx-3">Page <strong>{page}</strong> of {totalPages}</span>

                            <button
                                className="pagination-btn mx-2"
                                disabled={page === totalPages}
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                            >
                                <i className="fa-solid fa-angles-right"></i>
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {show && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        {/* Close Button */}
                        <div className="d-flex justify-content-between align-items-start">
                            {result === null && (
                                <h6 className="fw-semibold fs-22">Your answer</h6>
                            )}
                            <button className="btn-close ms-auto" onClick={handleClose}></button>
                        </div>

                        {/* Main Content */}
                        {result === null && (
                            <>
                                <input
                                    type="number"
                                    className="form-control answer-input mt-3"
                                    placeholder="Type your answer"
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                />
                                <button className="btn btn-submit w-100 mt-4" onClick={handleSubmit}>
                                    Submit
                                </button>
                            </>
                        )}

                        {result === 'correct' && (
                            <>
                                <div className="text-center">
                                    <img src={checkGif} alt="" className="w-75 mb-2" />
                                    <h2 className="text-0FB1A1 fw-bold mb-4">Your Answer is Correct</h2>
                                    <button className="btn btn-submit w-100" onClick={handleClose}>
                                        Continue to next question
                                    </button>
                                </div>
                            </>
                        )}

                        {result === 'wrong' && (
                            <>
                                <div className="text-center">
                                    <img src={crossGif} alt="" className="w-75 mb-2" />
                                    <h2 className="fw-bold mb-4">
                                        <span className="text-F81355">Correct Answer is </span>
                                        <span className="text-0FB1A1">{currentQuestion?.answer}</span>
                                    </h2>

                                    <div className="">
                                        <button className="btn btn-submit w-100 mb-3" onClick={handleReattempt}>
                                            Re-attempt this
                                        </button>
                                        <button className="btn btn-green rounded-pill w-100 fs-20"
                                            style={{ padding: "12px 0" }} onClick={handleClose}>
                                            Next Question
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default RecentPlayed