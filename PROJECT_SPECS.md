📜 Project Description: Solo-Flow Booking
1. Visão Geral (The "Pitch")
O Solo-Flow é um motor de reservas híbrido para profissionais independentes (Surf, Yoga, Personal Trainers). Ao contrário do Calendly (corporativo) ou Mindbody (complexo), o Solo-Flow foca-se na agilidade operacional. O profissional "pinta" a sua agenda diariamente e os alunos reservam em 2 cliques, sem necessidade de login.

2. Diferenciais Competitivos
Agenda Pintada: Não existe agenda automática. O profissional clica no botão (+) e adiciona slots quando quer.

Hibridismo Nativo: Gere sessões 1:1 e Turmas de Grupo no mesmo ecrã.

Fricção Zero: O aluno reserva apenas com Nome e Telemóvel.

Comunicação Proativa: Notificação por SMS em caso de alterações de horários (clima/imprevistos).

3. Arquitetura de Dados (Para o Cursor/Supabase)
A. Profiles (Dono do Negócio)
id, name, slug (url única), avatar_url, settings.

B. Templates (Os Moldes)
id, owner_id, title, type (Enum: PRIVATE, GROUP), duration_mins, capacity, price.

C. Slots (A Agenda Viva)
id, owner_id, template_id, start_time, end_time, current_capacity.

Lógica: Deve permitir sobreposição visual mas gerar um Aviso Visual se os horários chocarem.

D. Bookings (As Reservas)
id, slot_id, student_phone (Identificador Único), student_name, status (Enum: PENDING, CONFIRMED, CANCELED).

4. User Journeys
A. O Profissional (O "Artista" da Agenda)
Criação de Templates: Define os seus serviços base (ex: "Aula Surf 90min, 6 pax").

O Dashboard: Uma lista vertical cronológica.

Botão (+): Escolhe um Template -> Escolhe a Hora -> O Slot aparece na lista.

Gestão de Imprevistos: Ao arrastar ou alterar um Slot com alunos inscritos, o sistema dispara um SMS automático (via API, ex: Twilio) com um link para o aluno reconfirmar ou cancelar.

B. O Aluno (O "Quick Booker")
Acede a soloflow.com/slug-do-pro.

Vê a lista de horários disponíveis (Tons Claros, Minimalista).

Clica em "Reservar", insere Nome/Telemóvel.

Identificação: Se o telemóvel já existir na base de dados, o sistema associa automaticamente ao perfil histórico desse aluno no painel do instrutor.

Confirmação: Recebe sucesso imediato no ecrã.

5. Design System (Light & Airy)
Fundo: bg-slate-50.

Cards: bg-white, rounded-2xl, shadow-sm.

Interação: Botão (+) flutuante no canto inferior direito.

Semântica: Azul suave para Privadas, Verde suave para Grupos.

UX: Todo o fluxo de reserva do aluno é um "drawer" (modal) que desliza de baixo para cima.

6. Regras de Negócio Críticas (Lógica do Cursor)
Tracking de Alunos: O campo student_phone é o ID de facto do aluno. O instrutor deve conseguir ver quantas vezes o "João (+351...)" já veio às aulas.

Gestão de Conflitos: Ao detetar overlap de horários, o card do slot deve ganhar uma borda vermelha pulsante e um ícone de aviso.

Fluxo de SMS: * Evento: Slot.update(time).

Ação: Get Bookings where slot_id = X -> Send SMS -> Set Booking.status = PENDING.

7. Roadmap de Implementação (No Cursor)
Sprint 1: Autenticação do Pro + CRUD de Templates.

Sprint 2: Dashboard "Daily Feed" com o botão (+) para criar Slots.

Sprint 3: Página pública do Aluno com lógica de reserva e tracking por telemóvel.

Sprint 4: Integração de SMS para reagendamentos.