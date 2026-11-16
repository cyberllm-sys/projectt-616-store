import { Component, inject } from '@angular/core';
import { Produto } from '../model/produto';
import { CommonModule } from '@angular/common';
import { ProdutoService } from '../services/produto.service';

@Component({
  imports: [CommonModule],
  selector: 'app-feed',
  styleUrl: './feed.css',
  templateUrl: './feed.html',
})

export class Feed {
  lista: Produto[] = inject(ProdutoService).lista;

  verDetalhe(obj:Produto) {
    localStorage.setItem("produto", JSON.stringify(obj));
    location.href="./product-details";
  }

  calcularDesconto(valor:number, valorPromo:number): number {
    const desconto = ((valor - valorPromo) / valor) * 100;
    return Math.round(desconto);
  }
}
