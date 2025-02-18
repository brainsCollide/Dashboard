import { useState, useEffect } from "react";

const Modal = ({ isOpen, onClose, children }) => {
    const [showModal, setShowModal] = useState(false); // Controls DOM presence
    const [visible, setVisible] = useState(false); // Controls animation

    useEffect(() => {
        if (isOpen) {
            setShowModal(true);
            document.body.classList.add("overflow-hidden"); 
            setTimeout(() => setVisible(true), 10);
        } else {
            setVisible(false); 
            const timeout = setTimeout(() => {
                setShowModal(false);
                document.body.classList.remove("overflow-hidden"); // Re-enable background scroll
            }, 300); 
            return () => clearTimeout(timeout);
        }
    }, [isOpen]);

    if (!showModal) return null;

    return (
        <div
            className={`fixed inset-0 z-10 flex items-center justify-center bg-gray-600 bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0"
            }`}
        >
            {/* Modal Content */}
            <div
                className={`bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative transform transition-transform duration-300 max-h-screen overflow-y-auto ${
                    visible ? "scale-100 translate-y-0 opacity-100" : "scale-90 translate-y-4 opacity-0"
                }`}
            >
                {/* Close Button */}
                <button
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                    onClick={() => {
                        onClose();
                        setShowModal(false);
                    }}
                >
                    ✖
                </button>

                {/* Modal Body */}
                <div className="p-4 sm:p-6">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
