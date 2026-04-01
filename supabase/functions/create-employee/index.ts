import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user is an HR admin
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user has hr_admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'hr_admin')
      .single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: HR admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get employee data from request
    const { email, password, full_name, department, position } = await req.json()

    // Create the user
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update profile with additional info
    if (department || position) {
      await supabaseClient
        .from('profiles')
        .update({ department, position })
        .eq('user_id', newUser.user.id)
    }

    // Send welcome email with credentials
    try {
      await resend.emails.send({
        from: 'CareerPath HR <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to CareerPath - Your Account Details',
        html: `
          <h1>Welcome to CareerPath, ${full_name}!</h1>
          <p>Your employee account has been created by the HR team.</p>
          <h2>Your Login Credentials:</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p>Please log in at your earliest convenience and consider changing your password for security.</p>
          <p>Best regards,<br>The CareerPath Team</p>
        `,
      })
      console.log('Welcome email sent successfully to:', email)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Continue even if email fails
    }

    return new Response(JSON.stringify({ user: newUser.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})