from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
import os

# ── Cores ──────────────────────────────────────────────────────────────────
VERMELHO      = HexColor("#C0392B")
VERMELHO_ESC  = HexColor("#922B21")
VERMELHO_CLR  = HexColor("#FADBD8")
CINZA_ESC     = HexColor("#2C3E50")
CINZA_MED     = HexColor("#5D6D7E")
CINZA_CLR     = HexColor("#F2F3F4")
CINZA_LINHA   = HexColor("#E5E7E9")
BRANCO        = colors.white
AZUL_INFO     = HexColor("#EBF5FB")
AZUL_INFO_BRD = HexColor("#AED6F1")
AMARELO_AVISO = HexColor("#FEF9E7")
AMARELO_BRD   = HexColor("#F9E79F")

PAGE_W, PAGE_H = A4

# ── Estilos ────────────────────────────────────────────────────────────────
def estilos():
    return {
        "capa_titulo": ParagraphStyle(
            "capa_titulo", fontName="Helvetica-Bold", fontSize=32,
            textColor=BRANCO, alignment=TA_LEFT, leading=38,
        ),
        "capa_sub": ParagraphStyle(
            "capa_sub", fontName="Helvetica", fontSize=14,
            textColor=HexColor("#FADBD8"), alignment=TA_LEFT, leading=20,
        ),
        "capa_meta": ParagraphStyle(
            "capa_meta", fontName="Helvetica", fontSize=10,
            textColor=HexColor("#F1948A"), alignment=TA_LEFT, leading=16,
        ),
        "sumario_titulo": ParagraphStyle(
            "sumario_titulo", fontName="Helvetica-Bold", fontSize=18,
            textColor=CINZA_ESC, alignment=TA_LEFT, spaceBefore=0, spaceAfter=16,
        ),
        "sumario_item": ParagraphStyle(
            "sumario_item", fontName="Helvetica", fontSize=11,
            textColor=CINZA_MED, alignment=TA_LEFT, leading=22,
        ),
        "secao": ParagraphStyle(
            "secao", fontName="Helvetica-Bold", fontSize=16,
            textColor=BRANCO, alignment=TA_LEFT, leading=22,
            spaceBefore=0, spaceAfter=0,
        ),
        "sub": ParagraphStyle(
            "sub", fontName="Helvetica-Bold", fontSize=12,
            textColor=CINZA_ESC, spaceBefore=14, spaceAfter=6,
        ),
        "corpo": ParagraphStyle(
            "corpo", fontName="Helvetica", fontSize=10.5,
            textColor=CINZA_ESC, leading=17, spaceAfter=6,
        ),
        "lista": ParagraphStyle(
            "lista", fontName="Helvetica", fontSize=10.5,
            textColor=CINZA_ESC, leading=17, leftIndent=14, spaceAfter=3,
        ),
        "nota": ParagraphStyle(
            "nota", fontName="Helvetica-Oblique", fontSize=9.5,
            textColor=HexColor("#1A5276"), leading=15,
        ),
        "aviso": ParagraphStyle(
            "aviso", fontName="Helvetica-Oblique", fontSize=9.5,
            textColor=HexColor("#7D6608"), leading=15,
        ),
        "tabela_header": ParagraphStyle(
            "tabela_header", fontName="Helvetica-Bold", fontSize=9.5,
            textColor=BRANCO, alignment=TA_LEFT,
        ),
        "tabela_cell": ParagraphStyle(
            "tabela_cell", fontName="Helvetica", fontSize=9.5,
            textColor=CINZA_ESC, leading=14,
        ),
        "faq_q": ParagraphStyle(
            "faq_q", fontName="Helvetica-Bold", fontSize=10.5,
            textColor=VERMELHO_ESC, leading=16, spaceBefore=10, spaceAfter=4,
        ),
        "faq_a": ParagraphStyle(
            "faq_a", fontName="Helvetica", fontSize=10.5,
            textColor=CINZA_ESC, leading=16, spaceAfter=4,
        ),
        "rodape": ParagraphStyle(
            "rodape", fontName="Helvetica", fontSize=8,
            textColor=HexColor("#AAB7B8"), alignment=TA_CENTER,
        ),
    }

# ── Flowable: Cabeçalho de seção com barra vermelha ────────────────────────
class CabecalhoSecao(Flowable):
    def __init__(self, numero, titulo, largura=None):
        Flowable.__init__(self)
        self.numero = numero
        self.titulo = titulo
        self.largura = largura or (PAGE_W - 4*cm)
        self.altura = 38

    def wrap(self, aw, ah):
        return self.largura, self.altura + 14

    def draw(self):
        c = self.canv
        # fundo vermelho
        c.setFillColor(VERMELHO)
        c.roundRect(0, 14, self.largura, self.altura, 6, fill=1, stroke=0)
        # número
        c.setFillColor(VERMELHO_CLR)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(14, 14 + 13, self.numero)
        # título
        c.setFillColor(BRANCO)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(52, 14 + 13, self.titulo)

# ── Flowable: Caixa de nota/info ───────────────────────────────────────────
class CaixaNota(Flowable):
    def __init__(self, texto, tipo="info", largura=None):
        Flowable.__init__(self)
        self.texto = texto
        self.tipo = tipo  # "info" ou "aviso"
        self.largura = largura or (PAGE_W - 4*cm)

    def wrap(self, aw, ah):
        from reportlab.platypus import Paragraph
        st = estilos()["nota"] if self.tipo == "info" else estilos()["aviso"]
        p = Paragraph(self.texto, st)
        w, h = p.wrap(self.largura - 32, 9999)
        self.altura_texto = h
        return self.largura, h + 20

    def draw(self):
        c = self.canv
        bg  = AZUL_INFO   if self.tipo == "info" else AMARELO_AVISO
        brd = AZUL_INFO_BRD if self.tipo == "info" else AMARELO_BRD
        icone = "i" if self.tipo == "info" else "!"
        cor_icone = HexColor("#1A5276") if self.tipo == "info" else HexColor("#7D6608")
        h = self.altura_texto + 20
        c.setFillColor(bg)
        c.setStrokeColor(brd)
        c.setLineWidth(1)
        c.roundRect(0, 0, self.largura, h, 5, fill=1, stroke=1)
        c.setFillColor(cor_icone)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(10, h / 2 - 5, icone)
        from reportlab.platypus import Paragraph
        st = estilos()["nota"] if self.tipo == "info" else estilos()["aviso"]
        p = Paragraph(self.texto, st)
        p.wrapOn(c, self.largura - 32, 9999)
        p.drawOn(c, 28, 10)

# ── Header / Footer nas páginas ────────────────────────────────────────────
def cabecalho_rodape(canv, doc):
    canv.saveState()
    pg = doc.page
    # linha topo
    canv.setStrokeColor(CINZA_LINHA)
    canv.setLineWidth(0.5)
    canv.line(2*cm, PAGE_H - 1.4*cm, PAGE_W - 2*cm, PAGE_H - 1.4*cm)
    # marca no topo
    canv.setFillColor(VERMELHO)
    canv.setFont("Helvetica-Bold", 9)
    canv.drawString(2*cm, PAGE_H - 1.2*cm, "XTELHAS")
    canv.setFillColor(CINZA_MED)
    canv.setFont("Helvetica", 9)
    canv.drawRightString(PAGE_W - 2*cm, PAGE_H - 1.2*cm, "Manual do Usuário")
    # rodapé
    canv.setStrokeColor(CINZA_LINHA)
    canv.line(2*cm, 1.4*cm, PAGE_W - 2*cm, 1.4*cm)
    canv.setFillColor(CINZA_MED)
    canv.setFont("Helvetica", 8)
    canv.drawCentredString(PAGE_W / 2, 0.9*cm, f"— {pg} —")
    canv.drawString(2*cm, 0.9*cm, "sistema-x-telhas.vercel.app")
    canv.drawRightString(PAGE_W - 2*cm, 0.9*cm, "v1.0 · 2025")
    canv.restoreState()

def primeira_pagina(canv, doc):
    # não desenha header/footer na capa
    pass

# ── Tabela estilizada ──────────────────────────────────────────────────────
def fazer_tabela(cabecalhos, linhas, col_widths=None):
    st = estilos()
    dados = [[Paragraph(c, st["tabela_header"]) for c in cabecalhos]]
    for linha in linhas:
        dados.append([Paragraph(str(c), st["tabela_cell"]) for c in linha])

    largura_total = PAGE_W - 4*cm
    if not col_widths:
        n = len(cabecalhos)
        col_widths = [largura_total / n] * n

    t = Table(dados, colWidths=col_widths, repeatRows=1)
    estilo = TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  VERMELHO),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [BRANCO, CINZA_CLR]),
        ("GRID",         (0, 0), (-1, -1), 0.4, CINZA_LINHA),
        ("TOPPADDING",   (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 7),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [4]),
    ])
    t.setStyle(estilo)
    return t

# ── Lista numerada ─────────────────────────────────────────────────────────
def lista_numerada(items):
    st = estilos()
    result = []
    for i, item in enumerate(items, 1):
        result.append(Paragraph(f"<b>{i}.</b>  {item}", st["lista"]))
    return result

def lista_bullet(items):
    st = estilos()
    result = []
    for item in items:
        result.append(Paragraph(f"<font color='#C0392B'>•</font>  {item}", st["lista"]))
    return result

# ── Capa ───────────────────────────────────────────────────────────────────
def pagina_capa(c, doc):
    w, h = PAGE_W, PAGE_H
    # fundo gradiente simulado com retângulos
    c.setFillColor(VERMELHO_ESC)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(VERMELHO)
    c.rect(0, h * 0.35, w, h * 0.65, fill=1, stroke=0)
    # faixa branca decorativa diagonal
    c.saveState()
    c.setFillColor(HexColor("#FFFFFF10"))
    from reportlab.lib.utils import simpleSplit
    c.translate(w * 0.6, 0)
    c.rotate(15)
    c.rect(0, 0, w * 0.8, h * 1.5, fill=1, stroke=0)
    c.restoreState()
    # barra lateral esquerda
    c.setFillColor(VERMELHO_ESC)
    c.rect(0, 0, 1.2*cm, h, fill=1, stroke=0)
    # logo/marca
    c.setFillColor(BRANCO)
    c.setFont("Helvetica-Bold", 42)
    c.drawString(2*cm, h - 5*cm, "XTelhas")
    c.setFillColor(VERMELHO_CLR)
    c.setFont("Helvetica", 16)
    c.drawString(2*cm, h - 5.9*cm, "Sistema Financeiro")
    # linha separadora
    c.setStrokeColor(HexColor("#FFFFFF50"))
    c.setLineWidth(1)
    c.line(2*cm, h - 6.6*cm, w - 2*cm, h - 6.6*cm)
    # título do manual
    c.setFillColor(BRANCO)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(2*cm, h - 8.5*cm, "Manual do Usuário")
    c.setFillColor(HexColor("#FADBD8"))
    c.setFont("Helvetica", 13)
    c.drawString(2*cm, h - 9.4*cm, "Guia completo para uso do sistema")
    # módulos listados
    modulos = ["Dashboard", "Despesas", "Pedidos", "Relatório", "Tipos de Despesa", "Auditoria"]
    c.setFont("Helvetica", 10)
    x = 2*cm
    y = h - 11.5*cm
    for mod in modulos:
        c.setFillColor(VERMELHO_CLR)
        c.roundRect(x, y - 2, 3.8*cm, 0.65*cm, 4, fill=1, stroke=0)
        c.setFillColor(VERMELHO_ESC)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x + 6, y + 3, mod)
        x += 4.1*cm
        if x > w - 5*cm:
            x = 2*cm
            y -= 1*cm
    # rodapé da capa
    c.setFillColor(HexColor("#F1948A"))
    c.setFont("Helvetica", 9)
    c.drawString(2*cm, 2*cm, "Versão 1.0  ·  2025  ·  sistema-x-telhas.vercel.app")

# ── GERAR PDF ──────────────────────────────────────────────────────────────
def gerar():
    saida = os.path.join(os.path.dirname(__file__), "manual-usuario.pdf")
    st = estilos()

    doc = SimpleDocTemplate(
        saida,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2.2*cm, bottomMargin=2.2*cm,
        title="Manual do Usuário — SistemaXTelhas",
        author="XTelhas",
        subject="Manual do Usuário",
    )

    story = []

    # ── CAPA ──────────────────────────────────────────────────────────────
    # Desenhada via onFirstPage/on_page; apenas avança para página 2
    story.append(PageBreak())

    # ── SUMÁRIO ────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Sumário", st["sumario_titulo"]))
    story.append(HRFlowable(width="100%", thickness=2, color=VERMELHO, spaceAfter=16))

    capitulos = [
        ("1", "Acesso ao sistema",   "Login, criar conta, recuperar senha"),
        ("2", "Dashboard",           "Visão geral financeira da empresa"),
        ("3", "Despesas",            "Lançar, editar e excluir despesas"),
        ("4", "Pedidos",             "Registrar pedidos e notas fiscais"),
        ("5", "Relatório",           "Análise financeira por período"),
        ("6", "Tipos de Despesa",    "Gerenciar categorias de despesa"),
        ("7", "Auditoria",           "Histórico de ações (somente Admin)"),
        ("8", "Perguntas frequentes","Dúvidas comuns"),
    ]

    for num, titulo, desc in capitulos:
        dados = [[
            Paragraph(f"<font color='#C0392B'><b>{num}</b></font>", st["sumario_item"]),
            Paragraph(f"<b>{titulo}</b>", st["sumario_item"]),
            Paragraph(desc, ParagraphStyle("d", parent=st["sumario_item"],
                                           textColor=HexColor("#AAB7B8"), fontSize=9.5)),
        ]]
        t = Table(dados, colWidths=[1*cm, 6*cm, None])
        t.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING", (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
            ("TOPPADDING", (0,0), (-1,-1), 8),
            ("LINEBELOW", (0,0), (-1,-1), 0.4, CINZA_LINHA),
        ]))
        story.append(t)

    story.append(PageBreak())

    # ────────────────────────────────────────────────────────────────────────
    # 1. ACESSO AO SISTEMA
    # ────────────────────────────────────────────────────────────────────────
    story.append(CabecalhoSecao("1", "Acesso ao sistema"))
    story.append(Spacer(1, 0.4*cm))

    story.append(Paragraph("Login", st["sub"]))
    story += lista_numerada([
        "Acesse <b>sistema-x-telhas.vercel.app</b> no navegador",
        "Digite seu <b>e-mail</b> e <b>senha</b>",
        "Clique em <b>Entrar</b>",
    ])
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        'Caso tenha esquecido a senha, clique em <b>"Esqueci minha senha"</b> '
        "e siga as instruções enviadas ao seu e-mail.", st["corpo"]))
    story.append(Spacer(1, 8))
    story.append(CaixaNota(
        "<b>Sessão:</b> O sistema encerra sua sessão automaticamente após "
        "<b>10 minutos de inatividade</b>. Ao retornar, você será redirecionado "
        "à página de login e voltará ao local onde estava após autenticar novamente.",
        tipo="info"
    ))
    story.append(Spacer(1, 0.4*cm))

    story.append(Paragraph("Criar conta", st["sub"]))
    story += lista_numerada([
        'Na tela de login, clique na aba <b>"Criar conta"</b>',
        "Preencha nome, e-mail e senha",
        "A senha deve conter os seguintes requisitos:",
        "Confirme a senha e clique em <b>Criar conta</b>",
    ])
    story.append(Spacer(1, 4))
    story.append(fazer_tabela(
        ["Requisito", "Detalhe"],
        [
            ["Mínimo de 8 caracteres", "O sistema bloqueia senhas mais curtas"],
            ["Pelo menos uma letra",   "Maiúscula ou minúscula"],
            ["Pelo menos um número",   "Qualquer dígito de 0 a 9"],
            ["Caractere especial",     "! @ # $ % entre outros"],
        ],
        col_widths=[7*cm, None]
    ))

    story.append(PageBreak())

    # ────────────────────────────────────────────────────────────────────────
    # 2. DASHBOARD
    # ────────────────────────────────────────────────────────────────────────
    story.append(CabecalhoSecao("2", "Dashboard"))
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(
        "A tela inicial apresenta um resumo financeiro da empresa com dados do mês atual e do ano corrente.",
        st["corpo"]))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("O que é exibido", st["sub"]))
    story.append(fazer_tabela(
        ["Seção", "Descrição"],
        [
            ["Mês atual",        "Gráfico de barras comparando faturamento e despesas do mês corrente"],
            ["Lucro do mês",     "Faturamento − Despesas do mês atual"],
            ["Ano corrente",     "Gráfico de pizza com proporção entre faturamento e despesas no ano"],
            ["Lucro acumulado",  "Resultado líquido do ano (verde = positivo / vermelho = negativo)"],
        ],
        col_widths=[4.5*cm, None]
    ))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("Atualizar os dados", st["sub"]))
    story.append(Paragraph(
        "Clique no botão <b>Atualizar</b> no canto superior direito para recarregar "
        "as informações em tempo real.", st["corpo"]))

    story.append(Paragraph("Atalhos rápidos", st["sub"]))
    story.append(Paragraph(
        "Os quatro botões na parte inferior do dashboard levam diretamente aos módulos: "
        "<b>Despesas, Pedidos, Relatório</b> e <b>Tipos de Despesa</b>.", st["corpo"]))

    story.append(PageBreak())

    # ────────────────────────────────────────────────────────────────────────
    # 3. DESPESAS
    # ────────────────────────────────────────────────────────────────────────
    story.append(CabecalhoSecao("3", "Despesas"))
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(
        "Registre e gerencie todos os gastos da empresa, organizados por tipo e período.",
        st["corpo"]))

    story.append(Paragraph("Lançar uma despesa", st["sub"]))
    story += lista_numerada([
        "No menu lateral, clique em <b>Despesas</b>",
        "Selecione o <b>Tipo de despesa</b> no topo do formulário",
        "Preencha os campos conforme o tipo selecionado (ver tabelas abaixo)",
        "Informe a <b>data de lançamento</b> e o <b>mês de competência</b>",
        "Clique em <b>Salvar despesa</b>",
    ])
    story.append(Spacer(1, 8))

    story.append(Paragraph('<b>Tipo "Materiais"</b>', st["corpo"]))
    story.append(fazer_tabela(
        ["Campo", "Descrição"],
        [
            ["Unidade de medida", "KG, UN, LT, MT e outros"],
            ["Quantidade",        "Número com até 3 casas decimais"],
            ["Preço unitário",    "Valor por unidade em R$"],
            ["Total",             "Calculado automaticamente (Qtd × Preço)"],
        ],
        col_widths=[4.5*cm, None]
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph('<b>Tipo "Retiradas"</b>', st["corpo"]))
    story.append(fazer_tabela(
        ["Campo", "Descrição"],
        [
            ["Descrição", "Nome do sócio ou responsável (obrigatório)"],
            ["Valor",     "Valor da retirada em R$"],
        ],
        col_widths=[4.5*cm, None]
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Demais tipos</b>", st["corpo"]))
    story.append(fazer_tabela(
        ["Campo", "Descrição"],
        [
            ["Valor",     "Valor total da despesa em R$"],
            ["Descrição", "Texto explicativo (opcional)"],
        ],
        col_widths=[4.5*cm, None]
    ))
    story.append(Spacer(1, 8))
    story.append(CaixaNota(
        "<b>Mês de competência:</b> é o mês ao qual a despesa pertence para fins contábeis, "
        "podendo diferir da data do lançamento.", tipo="info"
    ))

    story.append(Paragraph("Editar uma despesa", st["sub"]))
    story += lista_numerada([
        "Localize a despesa na tabela",
        "Clique em <b>Editar</b>",
        "Faça as alterações necessárias",
        "Clique em <b>Salvar alterações</b>",
    ])
    story.append(Paragraph(
        'Para cancelar sem salvar, clique em <b>"Cancelar edição"</b>.', st["corpo"]))

    story.append(Paragraph("Excluir uma despesa", st["sub"]))
    story += lista_numerada([
        "Clique em <b>Excluir</b> na linha da despesa",
        "Confirme a exclusão na janela de confirmação",
    ])
    story.append(CaixaNota("Esta ação é <b>irreversível</b>. Não é possível desfazê-la.", tipo="aviso"))

    story.append(Paragraph("Filtrar por mês", st["sub"]))
    story.append(Paragraph(
        "Use o seletor de mês no canto superior direito para visualizar as despesas de um período. "
        "O total do mês é exibido no rodapé da tabela.", st["corpo"]))

    story.append(PageBreak())

    # ────────────────────────────────────────────────────────────────────────
    # 4. PEDIDOS
    # ────────────────────────────────────────────────────────────────────────
    story.append(CabecalhoSecao("4", "Pedidos"))
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(
        "Registre pedidos emitidos e controle faturamento, custo e notas fiscais.",
        st["corpo"]))

    story.append(Paragraph("Registrar um pedido", st["sub"]))
    story += lista_numerada([
        "No menu lateral, clique em <b>Pedidos</b>",
        "Preencha os campos do formulário",
        "Se houver nota fiscal, marque <b>NF emitida</b> e informe valor e número da NF",
        "Clique em <b>Salvar pedido</b>",
    ])
    story.append(Spacer(1, 8))
    story.append(fazer_tabela(
        ["Campo", "Descrição"],
        [
            ["Número do pedido",        "Identificador único (ex.: PED-2025-001)"],
            ["Valor total",             "Valor cobrado do cliente em R$"],
            ["Data de emissão",         "Data em que o pedido foi emitido"],
            ["Mês de competência",      "Mês contábil do pedido"],
            ["Preço de custo (opcional)","Custo dos itens do pedido em R$"],
        ],
        col_widths=[5.5*cm, None]
    ))
    story.append(Spacer(1, 8))
    story.append(CaixaNota(
        "<b>Preço de custo:</b> ao salvar um pedido com custo informado, o sistema cria "
        "automaticamente uma despesa do tipo <b>Materiais</b> com a descrição "
        '"Itens do pedido: {número}", facilitando o controle de margem.',
        tipo="info"
    ))

    story.append(Paragraph("Margem bruta", st["sub"]))
    story.append(Paragraph(
        "Quando o preço de custo é informado, o sistema calcula e exibe automaticamente:",
        st["corpo"]))
    story += lista_bullet([
        "Valor do pedido",
        "Preço de custo",
        "<b>Margem bruta</b> = Valor do pedido − Preço de custo",
    ])

    story.append(Paragraph("Editar e excluir pedidos", st["sub"]))
    story.append(Paragraph(
        "O procedimento é idêntico ao de despesas. A exclusão de um pedido <b>não</b> remove "
        "a despesa de materiais gerada automaticamente — esta deve ser excluída separadamente "
        "se necessário.", st["corpo"]))

    story.append(PageBreak())

    # ────────────────────────────────────────────────────────────────────────
    # 5. RELATÓRIO
    # ────────────────────────────────────────────────────────────────────────
    story.append(CabecalhoSecao("5", "Relatório"))
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(
        "Gere análises financeiras consolidadas por período com exportação para impressão e CSV.",
        st["corpo"]))

    story.append(Paragraph("Gerar um relatório", st["sub"]))
    story += lista_numerada([
        "No menu lateral, clique em <b>Relatório</b>",
        "Escolha o modo de período",
        "Clique em <b>Gerar relatório</b>",
    ])
    story.append(Spacer(1, 8))
    story.append(fazer_tabela(
        ["Modo", "Descrição"],
        [
            ["Mês atual",             "Do dia 1 do mês corrente até hoje"],
            ["Mês fechado",           "Selecione um dos últimos 12 meses"],
            ["Período personalizado", "Informe data inicial e final manualmente"],
        ],
        col_widths=[5*cm, None]
    ))

    story.append(Paragraph("O que o relatório exibe", st["sub"]))
    story += lista_bullet([
        "<b>Cards de resumo:</b> faturamento, valor com NF, total de despesas, margem (%)",
        "<b>Lucro líquido:</b> resultado em destaque (verde = lucro / vermelho = prejuízo)",
        "<b>Análise de faturamento:</b> proporção entre pedidos com NF e sem NF",
        "<b>Despesas por categoria:</b> gráfico de barras com valor e percentual de cada tipo",
        "<b>Tabela de pedidos:</b> lista completa com valores de NF e totais",
    ])

    story.append(Paragraph("Imprimir", st["sub"]))
    story.append(Paragraph(
        "Clique em <b>Imprimir</b> para abrir a janela de impressão do navegador. "
        "O layout é otimizado para impressão em A4.", st["corpo"]))

    story.append(Paragraph("Exportar CSV", st["sub"]))
    story.append(Paragraph(
        "Clique em <b>Exportar CSV</b> para baixar os dados do período em formato de planilha. "
        "O arquivo é nomeado automaticamente com a data de exportação.", st["corpo"]))

    story.append(PageBreak())

    # ────────────────────────────────────────────────────────────────────────
    # 6. TIPOS DE DESPESA
    # ────────────────────────────────────────────────────────────────────────
    story.append(CabecalhoSecao("6", "Tipos de Despesa"))
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(
        "Gerencie as categorias de despesa disponíveis no sistema.",
        st["corpo"]))

    story.append(Paragraph("Categorias padrão do sistema", st["sub"]))
    story.append(Paragraph(
        "O sistema possui <b>16 categorias pré-definidas</b> que não podem ser editadas ou excluídas:",
        st["corpo"]))

    categorias = [
        "Materiais", "Salário", "Alimentação", "Aluguel",
        "Energia", "Frete", "Internet", "Marketing",
        "Seguradora", "Bancos", "Manutenção de máquinas",
        "Manutenção de veículos", "Retiradas", "Serviços",
        "Rescisão contratual", "Outros",
    ]
    linhas_cat = []
    for i in range(0, len(categorias), 4):
        linhas_cat.append(categorias[i:i+4])

    dados_cat = []
    for linha in linhas_cat:
        while len(linha) < 4:
            linha.append("")
        dados_cat.append([Paragraph(c, ParagraphStyle(
            "cat", fontName="Helvetica", fontSize=9.5, textColor=CINZA_ESC,
        )) for c in linha])

    t_cat = Table(dados_cat, colWidths=[4*cm]*4)
    t_cat.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), CINZA_CLR),
        ("GRID",          (0,0), (-1,-1), 0.4, CINZA_LINHA),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
    ]))
    story.append(t_cat)
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("Adicionar categoria personalizada", st["sub"]))
    story += lista_numerada([
        "No menu lateral, clique em <b>Tipos de Despesa</b>",
        "Digite o nome da nova categoria no campo de texto",
        "Clique em <b>+ Adicionar</b>",
    ])

    story.append(Paragraph("Editar categoria personalizada", st["sub"]))
    story += lista_numerada([
        "Clique em <b>Editar</b> na linha da categoria",
        "Altere o nome",
        "Clique em <b>Salvar</b>",
    ])

    story.append(Paragraph("Excluir categoria personalizada", st["sub"]))
    story += lista_numerada([
        "Clique em <b>Excluir</b>",
        "Confirme na janela de confirmação",
    ])
    story.append(CaixaNota(
        "Categorias que já possuem despesas lançadas <b>não podem ser excluídas</b>. "
        "Remova ou reclassifique as despesas vinculadas antes de tentar excluir.", tipo="aviso"
    ))

    story.append(PageBreak())

    # ────────────────────────────────────────────────────────────────────────
    # 7. AUDITORIA
    # ────────────────────────────────────────────────────────────────────────
    story.append(CabecalhoSecao("7", "Auditoria"))
    story.append(Spacer(1, 0.4*cm))
    story.append(CaixaNota(
        "Este módulo é visível apenas para usuários com perfil <b>Administrador</b>.",
        tipo="aviso"
    ))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "Exibe o histórico completo de todas as ações realizadas no sistema.",
        st["corpo"]))

    story.append(Paragraph("O que é registrado", st["sub"]))
    story.append(fazer_tabela(
        ["Ação", "Descrição"],
        [
            ["LOGIN",  "Acesso ao sistema"],
            ["LOGOUT", "Saída do sistema"],
            ["CREATE", "Criação de registros"],
            ["UPDATE", "Alteração de registros"],
            ["DELETE", "Exclusão de registros"],
        ],
        col_widths=[3*cm, None]
    ))

    story.append(Paragraph("Filtrar registros", st["sub"]))
    story.append(Paragraph("Use os filtros disponíveis:", st["corpo"]))
    story += lista_bullet([
        "<b>Tipo de ação</b> — LOGIN, LOGOUT, CREATE, UPDATE, DELETE",
        "<b>Entidade</b> — despesas, pedidos, usuários, tipos-despesa",
        "<b>Data início / Data fim</b> — intervalo de datas",
    ])
    story.append(Paragraph(
        'Clique em <b>Filtrar</b> para aplicar ou <b>Limpar</b> para resetar os filtros.',
        st["corpo"]))

    story.append(Paragraph("Exportar CSV", st["sub"]))
    story.append(Paragraph(
        "Clique em <b>Exportar CSV</b> para baixar o log filtrado. "
        "O arquivo é nomeado com a data da exportação.", st["corpo"]))

    story.append(PageBreak())

    # ────────────────────────────────────────────────────────────────────────
    # 8. FAQ
    # ────────────────────────────────────────────────────────────────────────
    story.append(CabecalhoSecao("8", "Perguntas frequentes"))
    story.append(Spacer(1, 0.4*cm))

    faqs = [
        (
            "Fui desconectado sem querer. O que aconteceu?",
            "O sistema encerra a sessão após 10 minutos sem atividade para proteger seus dados. "
            "Faça login novamente — você será redirecionado à página em que estava."
        ),
        (
            "Excluí uma despesa por engano. Como desfazer?",
            "Não é possível desfazer exclusões. Para fins de auditoria, o registro da exclusão "
            "fica salvo no módulo de Auditoria (visível para administradores)."
        ),
        (
            "Salvei um pedido com custo e apareceu uma despesa de Materiais que não lancei.",
            "Esse comportamento é esperado. Ao informar o preço de custo de um pedido, o sistema "
            "registra automaticamente a despesa correspondente para facilitar o cálculo de margem."
        ),
        (
            "Não consigo excluir um tipo de despesa personalizado.",
            "Há despesas lançadas vinculadas a essa categoria. Exclua ou edite as despesas "
            "para outro tipo antes de tentar novamente."
        ),
        (
            "Quero adicionar outro usuário. Como faço?",
            'Acesse a tela de login e use a aba "Criar conta". Novos usuários são criados com '
            "perfil padrão; apenas administradores têm acesso ao módulo de Auditoria."
        ),
    ]

    for pergunta, resposta in faqs:
        bloco = KeepTogether([
            Paragraph(f"P: {pergunta}", st["faq_q"]),
            Paragraph(f"R: {resposta}", st["faq_a"]),
            HRFlowable(width="100%", thickness=0.5, color=CINZA_LINHA, spaceAfter=4),
        ])
        story.append(bloco)

    # ── BUILD ──────────────────────────────────────────────────────────────
    def on_page(canv, doc):
        if doc.page == 1:
            pagina_capa(canv, doc)
        else:
            cabecalho_rodape(canv, doc)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF gerado: {saida}")

if __name__ == "__main__":
    gerar()
