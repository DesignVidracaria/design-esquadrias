import { NextResponse } from 'next/server';

/**
 * Simula a busca de posts do Instagram.
 * Em um ambiente real, esta função faria uma chamada para a API do Instagram.
 * Aqui, ela retorna dados usando URLs de placeholder que funcionam como um preview.
 */
async function getInstagramPosts() {
  // Simula um atraso de rede para imitar uma chamada de API.
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Retorna um array de objetos com URLs de imagens de placeholder válidas.
  // Essas URLs são genéricas e funcionam em qualquer ambiente Next.js,
  // desde que o 'placehold.co' esteja configurado no next.config.js.
  // IMPORTANTE: Em produção, você DEVE substituir essas URLs pelos links
  // reais das imagens do seu Instagram.
  return [
    {
      id: "post1",
      // Imagem placeholder para 'Vidros e espelhos'
      image: "https://placehold.co/400x400/22d3ee/FFFFFF",
      url: "https://www.instagram.com/p/Cn7I9R9s9oL/",
      alt: "Postagem de vidros e espelhos"
    },
    {
      id: "post2",
      // Imagem placeholder para 'Box de banheiro'
      image: "https://placehold.co/400x400/4ade80/FFFFFF",
      url: "https://www.instagram.com/p/ClPhaUTL-Bx/",
      alt: "Postagem de box de banheiro"
    },
    {
      id: "post3",
      // Imagem placeholder para 'Fachada de vidro'
      image: "https://placehold.co/400x400/60a5fa/FFFFFF",
      url: "https://www.instagram.com/p/CkeGnHkOqKB/",
      alt: "Postagem de fachada de vidro"
    }
  ];
}

/**
 * Rota da API para buscar os posts do Instagram.
 * Acessível em `seu-site.com/api/instagram_feed`.
 * Este endpoint agora retorna um JSON com as URLs de imagens de placeholder válidas.
 */
export async function GET() {
  try {
    const posts = await getInstagramPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Erro ao buscar posts do Instagram:", error);
    return NextResponse.json(
      { error: "Erro ao buscar posts do Instagram" },
      { status: 500 }
    );
  }
}
