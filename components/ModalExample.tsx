"use client"

import { useState } from "react"
import FullScreenModal from "./FullScreenModal"

export default function ModalExample() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="p-8">
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-[var(--secondary-blue)] hover:bg-[var(--secondary-blue)]/80 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
      >
        Abrir Modal
      </button>

      <FullScreenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal de Exemplo"
        showCloseButton={true}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Conteúdo do Modal</h3>
            <p className="text-white/80 text-lg leading-relaxed">
              Este é um exemplo de modal que preenche toda a tela. Você pode adicionar qualquer conteúdo aqui.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white/10 rounded-lg p-6 backdrop-blur-sm border border-white/20">
                <h4 className="text-white font-semibold mb-2">Item {item}</h4>
                <p className="text-white/70 text-sm">
                  Exemplo de conteúdo dentro do modal. Este card demonstra como o conteúdo pode ser organizado.
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all duration-300 border border-white/30"
            >
              Fechar Modal
            </button>
          </div>
        </div>
      </FullScreenModal>
    </div>
  )
}
