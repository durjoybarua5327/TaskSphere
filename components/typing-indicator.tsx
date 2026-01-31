import { motion } from "framer-motion";

export function TypingIndicator({ label = "Thinking" }: { label?: string }) {
    return (
        <div className="flex gap-1 items-center px-4 py-2 bg-slate-100 rounded-2xl w-fit">
            <div className="flex gap-1 mr-2">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.2 }}
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.4 }}
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {label}
            </span>
        </div>
    );
}

export function AITypingIndicator() {
    return (
        <div className="flex gap-1 items-center px-4 py-3 bg-purple-900 rounded-2xl w-fit shadow-xl shadow-purple-100">
            <div className="flex gap-1 mr-2">
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    className="w-1.5 h-1.5 bg-white rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.2 }}
                    className="w-1.5 h-1.5 bg-white rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.4 }}
                    className="w-1.5 h-1.5 bg-white rounded-full"
                />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                AI Processing
            </span>
        </div>
    );
}
