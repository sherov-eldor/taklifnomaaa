import { motion } from "framer-motion";

function SectionWrapper({ children }) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="paper-texture relative w-full overflow-hidden"
    >
      <div className="relative z-10 w-full">
        {children}
      </div>
    </motion.section>
  );
}

export default SectionWrapper;
